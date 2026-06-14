import '@testing-library/jest-dom/vitest';
import { afterAll, afterEach, beforeAll, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import { server } from './msw/server';

// On neutralise le vrai client Socket.io en test : sinon une session
// authentifiée déclenche une connexion réseau vers VITE_SOCKET_URL, ce qui
// laisse un handle ouvert et fait planter Node au teardown (libuv).
vi.mock('@/lib/socket', () => ({
  getSocket: () => null,
  connectSocket: () => null,
  reconnectSocket: () => undefined,
  disconnectSocket: () => undefined,
}));

// MSW : on intercepte les appels API. Les requêtes non gérées (ex. chargement
// des fichiers i18n) sont laissées passer pour ne pas faire échouer les tests.
beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));

afterEach(() => {
  server.resetHandlers();
  cleanup();
});

afterAll(() => server.close());
