import { readFileSync } from 'node:fs';
import path from 'node:path';
import { length } from '@turf/turf';
import type { FeatureCollection, Point } from 'geojson';
import type { DepotFeature, DepotProps, RouteCollection, RouteFeature } from '@tracking/shared';

const DATA_DIR = path.resolve(import.meta.dirname, '../../data');

function readGeoJson<T>(file: string): T {
  return JSON.parse(readFileSync(path.join(DATA_DIR, file), 'utf-8')) as T;
}

export interface RouteEntry {
  feature: RouteFeature;
  lengthKm: number;
}

/** Order = address + route there + route back */
export interface Order {
  destinationId: string;
  outbound: RouteEntry;
  back: RouteEntry;
}

export interface RouteNetwork {
  depots: DepotFeature[];
  ordersByDepot: Map<string, Order[]>;
}

export function loadRouteNetwork(): RouteNetwork {
  const depots = readGeoJson<FeatureCollection<Point, DepotProps>>('depots.geojson').features;
  const routes = readGeoJson<RouteCollection>('routes.geojson').features;

  const byId = new Map<string, RouteEntry>(
    routes.map((feature) => [
      feature.properties.id,
      { feature, lengthKm: length(feature, { units: 'kilometers' }) },
    ]),
  );

  const ordersByDepot = new Map<string, Order[]>();
  for (const { properties } of routes) {
    if (properties.direction !== 'outbound') continue;
    const outbound = byId.get(`${properties.destinationId}-outbound`);
    const back = byId.get(`${properties.destinationId}-return`);
    if (!outbound || !back) continue;

    const list = ordersByDepot.get(properties.depotId) ?? [];
    list.push({ destinationId: properties.destinationId, outbound, back });
    ordersByDepot.set(properties.depotId, list);
  }

  return { depots, ordersByDepot };
}
