import { io, type Socket } from 'socket.io-client';
import { env } from './env';

let socket: Socket | null = null;

/** Retourne le socket courant (null tant que non connecté). */
export function getSocket(): Socket | null {
  return socket;
}

/** Connecte le socket avec l'access token courant. Idempotent. */
export function connectSocket(token: string): Socket {
  if (socket) {
    // Déjà un socket : on met à jour le token et on (re)connecte.
    socket.auth = { token };
    if (!socket.connected) socket.connect();
    return socket;
  }

  socket = io(env.socketUrl, {
    auth: { token },
    autoConnect: true,
    transports: ['websocket'],
  });
  return socket;
}

/** Reconnecte avec un nouveau token (après refresh). No-op si pas de socket. */
export function reconnectSocket(token: string): void {
  if (!socket) return;
  socket.auth = { token };
  socket.disconnect().connect();
}

/** Déconnecte et détruit le socket (au logout). */
export function disconnectSocket(): void {
  if (!socket) return;
  socket.disconnect();
  socket = null;
}
