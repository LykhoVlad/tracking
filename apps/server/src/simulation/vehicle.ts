import type { LngLat, VehiclePhase } from '@tracking/shared';
import type { Order, RouteEntry } from './routes';

export interface SimVehicle {
  id: string;
  name: string;
  depotId: string;
  cruiseSpeedKmh: number;

  phase: VehiclePhase;
  order: Order | null;
  route: RouteEntry | null; // the route the car is currently taking
  distanceOnRouteKm: number;

  position: LngLat; // precise positioning, no noise
  bearing: number;
  speedKmh: number;
  targetSpeedKmh: number;

  // timers in seconds of simulation
  waitUntilSec: number; //  end of loading or unloading
  stopUntilSec: number; // traffic light
  speedingUntilSec: number;
  offlineUntilSec: number;
}
