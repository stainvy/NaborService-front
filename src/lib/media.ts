import { env } from './env';
import { getAccessToken } from './tokenStore';

// URL de streaming d'un média stocké côté back (avatar, bannière, photos…).
// Forme confirmée : ${VITE_API_URL}/media/<mongoId>/stream
// L'endpoint exige un JWT (header Authorization ou ?token=) — les balises
// <img>/<audio>/<video>/<iframe> et les liens de téléchargement ne peuvent
// pas poser de header, donc le token est passé en query string ici.
export function mediaUrl(mongoId?: string | null): string | null {
  if (!mongoId) return null;
  const base = `${env.apiUrl}/media/${mongoId}/stream`;
  const token = getAccessToken();
  return token ? `${base}?token=${encodeURIComponent(token)}` : base;
}
