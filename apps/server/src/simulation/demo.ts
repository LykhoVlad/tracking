import { writeFileSync } from 'node:fs';
import { lineString } from '@turf/turf';
import type { LngLat } from '@tracking/shared';
import { loadRouteNetwork } from './routes';
import { Simulator } from './simulator';

const TRACK_VEHICLE = 'veh-01';
const recentEvents: string[] = [];
const track: LngLat[] = [];

const sim = new Simulator(loadRouteNetwork(), {
  onDispatch: (e) => {
    const time = new Date(e.timestamp).toLocaleTimeString();
    recentEvents.unshift(`${time}  ${e.vehicleId} → ${e.phase} ${e.destinationId ?? ''}`);
    recentEvents.length = Math.min(recentEvents.length, 8);
  },
  onTelemetry: (reports) => {
    const mine = reports.find((r) => r.vehicleId === TRACK_VEHICLE);
    if (mine) track.push(mine.position);

    console.clear();
    console.table(sim.getDebugRows());
    console.log(`📡 Reports this tick: ${reports.length}/${sim.getRegistry().length}`);
    console.log('\nLast events:\n' + recentEvents.join('\n'));
  },
});

sim.setSpeed(Number(process.env.SIM_SPEED ?? 10));
sim.start();

process.on('SIGINT', () => {
  if (track.length > 1) {
    writeFileSync('debug-track.geojson', JSON.stringify(lineString(track, { id: TRACK_VEHICLE })));
    console.log(`\n💾 Saved ${track.length} points to debug-track.geojson`);
  }
  process.exit(0);
});
