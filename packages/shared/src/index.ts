export * from './geo';
export * from './vehicle';

export const SIM_TICK_MS = 1000;

export interface ServerToClientEvents {
  'server:hello': (payload: { message: string; tickMs: number }) => void;
}

export interface ClientToServerEvents {}
