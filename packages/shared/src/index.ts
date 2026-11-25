export const SIM_TICK_MS = 1000;

export type VehicleStatus =
  | 'idle'
  | 'en_route'
  | 'delivering'
  | 'returning'
  | 'offline';

export interface Vehicle {
  id: string;
  name: string;
  status: VehicleStatus;
  position: [number, number]; // [lng, lat]
  bearing: number;
  speed: number;
}

export interface ServerToClientEvents {
  'server:hello': (payload: { message: string; tickMs: number }) => void;
}

export interface ClientToServerEvents {}
