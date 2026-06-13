import type { Role } from './roles';

// Objet renvoyé par GET /v1/users/me (camelCase, conforme au back réel).
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  visibility?: string;
  bio?: string | null;
  locale?: string;
  messagePolicy?: string;
  neighbourhoodId?: string | null;
  profilePictureMongoId?: string | null;
  bannerMongoId?: string | null;
  createdAt: string;
  updatedAt: string;
}
