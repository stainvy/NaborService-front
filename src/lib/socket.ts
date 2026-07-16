import { io, type Socket } from 'socket.io-client';
import { env } from './env';

// Fabrique un gestionnaire de socket pour un namespace donné (vide = namespace
// par défaut). Chaque instance partage la même origine (`env.socketUrl`), donc
// socket.io-client multiplexe les connexions sur un seul transport sous-jacent —
// ce n'est pas une connexion réseau séparée par namespace.
function createSocketManager(namespacePath: string) {
  let socket: Socket | null = null;
  const url = namespacePath ? `${env.socketUrl}${namespacePath}` : env.socketUrl;

  function get(): Socket | null {
    return socket;
  }

  function connect(token: string): Socket {
    if (socket) {
      socket.auth = { token };
      if (!socket.connected) socket.connect();
      return socket;
    }
    socket = io(url, { auth: { token }, autoConnect: true, transports: ['websocket'] });
    return socket;
  }

  function reconnect(token: string): void {
    if (!socket) return;
    socket.auth = { token };
    socket.disconnect().connect();
  }

  function disconnect(): void {
    if (!socket) return;
    socket.disconnect();
    socket = null;
  }

  return { get, connect, reconnect, disconnect };
}

const defaultMgr = createSocketManager('');
const chatMgr = createSocketManager('/chat');
const pollsMgr = createSocketManager('/polls');
const callsMgr = createSocketManager('/calls');

/** Retourne le socket courant (null tant que non connecté). */
export const getSocket = defaultMgr.get;
/** Connecte le socket avec l'access token courant. Idempotent. */
export const connectSocket = defaultMgr.connect;
/** Reconnecte avec un nouveau token (après refresh). No-op si pas de socket. */
export const reconnectSocket = defaultMgr.reconnect;
/** Déconnecte et détruit le socket (au logout). */
export const disconnectSocket = defaultMgr.disconnect;

export const getChatSocket = chatMgr.get;
export const connectChatSocket = chatMgr.connect;
export const reconnectChatSocket = chatMgr.reconnect;
export const disconnectChatSocket = chatMgr.disconnect;

export const getPollsSocket = pollsMgr.get;
export const connectPollsSocket = pollsMgr.connect;
export const reconnectPollsSocket = pollsMgr.reconnect;
export const disconnectPollsSocket = pollsMgr.disconnect;

export const getCallsSocket = callsMgr.get;
export const connectCallsSocket = callsMgr.connect;
export const reconnectCallsSocket = callsMgr.reconnect;
export const disconnectCallsSocket = callsMgr.disconnect;

// Les sockets par namespace partagent le cycle de vie du socket par défaut
// (voir AuthProvider) — ces agrégats évitent de dupliquer cette logique à
// chaque nouveau namespace (ex. `calls` à venir).
export function connectAllSockets(token: string): void {
  connectSocket(token);
  connectChatSocket(token);
  connectPollsSocket(token);
  connectCallsSocket(token);
}

export function reconnectAllSockets(token: string): void {
  reconnectSocket(token);
  reconnectChatSocket(token);
  reconnectPollsSocket(token);
  reconnectCallsSocket(token);
}

export function disconnectAllSockets(): void {
  disconnectSocket();
  disconnectChatSocket();
  disconnectPollsSocket();
  disconnectCallsSocket();
}
