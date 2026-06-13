import '@testing-library/jest-dom/vitest';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { cleanup } from '@testing-library/react';
import { server } from './msw/server';

// MSW : on intercepte les appels API. Les requêtes non gérées (ex. chargement
// des fichiers i18n) sont laissées passer pour ne pas faire échouer les tests.
beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));

afterEach(() => {
  server.resetHandlers();
  cleanup();
});

afterAll(() => server.close());
