import { io, Socket } from 'socket.io-client';
import type { SocketEvents } from '@/types';

let socket: Socket<SocketEvents, SocketEvents> | null = null;

export function getSocket(): Socket<SocketEvents, SocketEvents> {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000', {
      autoConnect: false,
      transports: ['websocket'],
    });
  }
  return socket;
}

export function connectSocket(token: string) {
  const s = getSocket();
  s.auth = { token };
  s.connect();
  return s;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
