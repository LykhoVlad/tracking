import { createServer } from 'node:http';
import { Server } from 'socket.io';
import {
  SIM_TICK_MS,
  type ClientToServerEvents,
  type ServerToClientEvents,
} from '@tracking/shared';

const PORT = Number(process.env.PORT ?? 4000);
const WEB_ORIGIN = process.env.WEB_ORIGIN ?? 'http://localhost:3000';

const httpServer = createServer();
const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: { origin: WEB_ORIGIN },
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  socket.emit('server:hello', {
    message: 'Tracking server online',
    tickMs: SIM_TICK_MS,
  });
});

httpServer.listen(PORT, () => console.log(`Socket server running on :${PORT}`));
