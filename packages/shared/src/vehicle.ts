import type { LngLat } from './geo';

export type VehiclePhase = 'idle' | 'en_route' | 'delivering' | 'returning';

export interface TelemetryReport {
  vehicleId: string;
  timestamp: number;
  position: LngLat;
  speedKmh: number;
  bearing: number;
}

export interface PhaseChangedEvent {
  type: 'phase:changed';
  vehicleId: string;
  phase: VehiclePhase;
  destinationId: string | null;
  routeId: string | null;
  timestamp: number;
}

export type DispatchEvent = PhaseChangedEvent;

export interface Vehicle {
  id: string;
  name: string;
  depotId: string;
  phase: VehiclePhase;
  isOnline: boolean;
  lastSeenAt: number | null;
  position: LngLat | null;
  bearing: number;
  speedKmh: number;
  destinationId: string | null;
  routeId: string | null;
}

export interface FleetRegistryEntry {
  id: string;
  name: string;
  depotId: string;
}
