import type { NaborEvent } from './types';

// Vrai si l'événement est passé (sa fin, sinon son début, est antérieure à
// maintenant). Point unique de la règle de date : ne changer qu'ici si elle
// évolue. Un événement sans date n'est jamais considéré comme passé.
export function isPastEvent(event: Pick<NaborEvent, 'startsAt' | 'endsAt'>): boolean {
  const ref = event.endsAt ?? event.startsAt;
  if (!ref) return false;
  return new Date(ref).getTime() < Date.now();
}
