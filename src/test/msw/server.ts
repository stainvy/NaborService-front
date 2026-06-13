import { setupServer } from 'msw/node';
import { handlers } from './handlers';

/** Serveur MSW partagé par la suite de tests (mock réseau, cf. CLAUDE.md §10). */
export const server = setupServer(...handlers);
