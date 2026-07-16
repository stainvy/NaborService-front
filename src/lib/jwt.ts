/** Décode (sans vérifier) le payload d'un JWT et renvoie son expiration en ms epoch, ou null si illisible. */
export function getJwtExpiryMs(token: string): number | null {
  const payload = token.split('.')[1];
  if (!payload) return null;
  try {
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    const { exp } = JSON.parse(json) as { exp?: number };
    return typeof exp === 'number' ? exp * 1000 : null;
  } catch {
    return null;
  }
}
