import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  bbox,
  booleanPointInPolygon,
  circle,
  distance,
  featureCollection,
  length as lineLength,
  lineString,
  nearestPoint,
  point,
  truncate,
} from '@turf/turf';
import type { LineString } from 'geojson';
import type {
  DepotFeature,
  DestinationFeature,
  LngLat,
  RouteFeature,
  RouteProps,
} from '@tracking/shared';
import { requireEnv } from '../src/utils/requireEnv';
import { mulberry32 } from '../src/lib/random';

const MAPBOX_TOKEN = requireEnv('MAPBOX_TOKEN');

const CONFIG = {
  seed: 42,
  center: [30.5234, 50.4501] as LngLat,
  serviceRadiusKm: 10,
  destinationsCount: 40,
  minRouteKm: 2,
  maxRouteKm: 20,
  maxSnapDistanceM: 300,
  requestDelayMs: 250,
  outDir: path.resolve('data'),
};

const DEPOTS: { id: string; name: string; coords: LngLat }[] = [
  { id: 'depot-right', name: 'Склад (правий берег)', coords: [30.442, 50.456] },
  { id: 'depot-left', name: 'Склад (лівий берег)', coords: [30.615, 50.44] },
];

const random = mulberry32(CONFIG.seed);
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const serviceArea = circle(CONFIG.center, CONFIG.serviceRadiusKm, {
  steps: 64,
  units: 'kilometers',
});
const [minX, minY, maxX, maxY] = bbox(serviceArea);

function randomPointInServiceArea(): LngLat {
  while (true) {
    const candidate: LngLat = [minX + random() * (maxX - minX), minY + random() * (maxY - minY)];
    if (booleanPointInPolygon(candidate, serviceArea)) return candidate;
  }
}

interface DirectionsResponse {
  code: string;
  message?: string;
  routes: { geometry: LineString; distance: number; duration: number }[];
  waypoints: { location: LngLat; name: string }[];
}

async function fetchRoute(from: LngLat, to: LngLat): Promise<DirectionsResponse | null> {
  const coords = `${from.join(',')};${to.join(',')}`;
  const params = new URLSearchParams({
    geometries: 'geojson',
    overview: 'full',
    access_token: MAPBOX_TOKEN,
  });
  const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${coords}?${params}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Mapbox HTTP ${res.status}: ${await res.text()}`);

  const data = (await res.json()) as DirectionsResponse;
  if (data.code !== 'Ok' || data.routes.length === 0) return null;
  return data;
}

function toRouteFeature(
  data: DirectionsResponse,
  meta: Pick<RouteProps, 'depotId' | 'destinationId' | 'direction'>,
): RouteFeature {
  const route = data.routes[0];
  const feature = lineString(route.geometry.coordinates, {
    id: `${meta.destinationId}-${meta.direction}`,
    ...meta,
    distanceKm: Number((route.distance / 1000).toFixed(2)),
    durationMin: Number((route.duration / 60).toFixed(1)),
  });

  return truncate(feature, { precision: 6 });
}

async function main() {
  const depots: DepotFeature[] = DEPOTS.map((d) => point(d.coords, { id: d.id, name: d.name }));
  const depotsCollection = featureCollection(depots);

  const destinations: DestinationFeature[] = [];
  const routes: RouteFeature[] = [];
  const maxAttempts = CONFIG.destinationsCount * 5;
  let attempts = 0;

  while (destinations.length < CONFIG.destinationsCount && attempts < maxAttempts) {
    attempts++;
    const candidate = randomPointInServiceArea();

    // 1. Nearest depot
    const nearest = nearestPoint(candidate, depotsCollection);
    const depot = DEPOTS[nearest.properties.featureIndex];

    // 2. Road to depot
    const outbound = await fetchRoute(depot.coords, candidate);
    await sleep(CONFIG.requestDelayMs);
    if (!outbound) {
      console.warn('⏭  no route, skip');
      continue;
    }

    // 3. Is there even a point by the road?
    const snapped = outbound.waypoints[1].location;
    const snapDistanceM = distance(candidate, snapped, { units: 'meters' });
    if (snapDistanceM > CONFIG.maxSnapDistanceM) {
      console.warn(`⏭  ${snapDistanceM.toFixed(0)} m from the road (river/park?), skip`);
      continue;
    }

    // 4. Is the length okay?
    const outboundKm = outbound.routes[0].distance / 1000;
    if (outboundKm < CONFIG.minRouteKm || outboundKm > CONFIG.maxRouteKm) {
      console.warn(`⏭  ${outboundKm.toFixed(1)} km is out of range, skip`);
      continue;
    }

    // 5. Return route: Please inquire separately, as the return route may be different due to one-way traffic.
    const back = await fetchRoute(snapped, depot.coords);
    await sleep(CONFIG.requestDelayMs);
    if (!back) continue;

    // 6. Save
    const destinationId = `dest-${String(destinations.length + 1).padStart(2, '0')}`;
    destinations.push(point(snapped, { id: destinationId, depotId: depot.id }));
    routes.push(
      toRouteFeature(outbound, { depotId: depot.id, destinationId, direction: 'outbound' }),
      toRouteFeature(back, { depotId: depot.id, destinationId, direction: 'return' }),
    );
    console.log(`✅ ${destinationId} ← ${depot.id}: ${outboundKm.toFixed(1)} km`);
  }

  if (destinations.length < CONFIG.destinationsCount) {
    console.warn(
      `⚠️  Only ${destinations.length}/${CONFIG.destinationsCount} destinations generated`,
    );
  }

  // Cross-check: distance from the API and distance calculated by Turf
  const sample = routes[0];
  console.log(
    `🔍 ${sample.properties.id}: API = ${sample.properties.distanceKm} km, ` +
      `turf.length = ${lineLength(sample, { units: 'kilometers' }).toFixed(2)} km`,
  );

  await mkdir(CONFIG.outDir, { recursive: true });
  const write = (name: string, data: unknown) =>
    writeFile(path.join(CONFIG.outDir, name), JSON.stringify(data));

  await Promise.all([
    write('service-area.geojson', serviceArea),
    write('depots.geojson', depotsCollection),
    write('destinations.geojson', featureCollection(destinations)),
    write('routes.geojson', featureCollection(routes)),
  ]);

  console.log(
    `💾 Saved ${destinations.length} destinations and ${routes.length} routes to ${CONFIG.outDir}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
