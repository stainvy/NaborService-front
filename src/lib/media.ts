import { env } from './env';

// URL de streaming d'un média stocké côté back (avatar, bannière, photos…).
// Forme confirmée : ${VITE_API_URL}/media/<mongoId>/stream
export function mediaUrl(mongoId?: string | null): string | null {
  return mongoId ? `${env.apiUrl}/media/${mongoId}/stream` : null;
}
