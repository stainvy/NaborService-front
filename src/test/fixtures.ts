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
