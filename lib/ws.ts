'use client';
import { io, type Socket } from 'socket.io-client';
import { WS_BASE } from './api';
import { getStoredToken } from './auth';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    const token = getStoredToken();
    socket = io(WS_BASE, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      auth: token ? { token } : {},
    });
  }
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
