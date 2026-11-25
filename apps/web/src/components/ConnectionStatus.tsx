'use client';

import { useEffect, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from '@tracking/shared';

export function ConnectionStatus() {
  const [status, setStatus] = useState('connecting…');

  useEffect(() => {
    const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(
      process.env.NEXT_PUBLIC_SOCKET_URL!,
    );

    socket.on('server:hello', ({ message }) => setStatus(message));
    socket.on('disconnect', () => setStatus('disconnected'));

    return () => {
      socket.disconnect();
    };
  }, []);

  return <p>Socket: {status}</p>;
}
