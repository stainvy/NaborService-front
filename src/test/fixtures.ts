import { http, HttpResponse } from 'msw';
import { env } from '@/lib/env';
import { server } from './msw/server';
import type { User } from '@/types/user';

export const fakeUser: User = {
  id: 'me-1',
  email: 'jane@example.com',
  firstName: 'Jane',
  lastName: 'Doe',
  role: 'resident',
  visibility: 'public',
  bio: 'Hello',
  locale: 'fr',
  messagePolicy: 'open',
  neighbourhoodId: null,
  profilePictureMongoId: null,
  bannerMongoId: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: null,
};

// Rend l'AuthProvider authentifié : le refresh silencieux réussit et /users/me
// renvoie un utilisateur.
export function mockAuthenticated(user: User = fakeUser) {
  server.use(
    http.post(`${env.apiUrl}/auth/refresh`, () => HttpResponse.json({ access_token: 'tok' })),
    http.get(`${env.apiUrl}/users/me`, () => HttpResponse.json(user)),
  );
}

// Catalogue vide (catégories + quartiers) — suffisant pour les selects en test.
export function mockEmptyCatalog() {
  server.use(
    http.get(`${env.apiUrl}/categories/listings`, () => HttpResponse.json([])),
    http.get(`${env.apiUrl}/neighbourhoods`, () => HttpResponse.json([])),
  );
}

export function makeListing(overrides: Record<string, unknown> = {}) {
  return {
    id: 'listing-1',
    creatorId: 'someone-else',
    title: 'Tonte de pelouse',
    description: 'Je tonds',
    categoryId: null,
    listingType: 'offer',
    priceCents: 1500,
    status: 'open',
    neighbourhoodId: null,
    mongoDocumentId: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: null,
    closedAt: null,
    deletedAt: null,
    ...overrides,
  };
}
