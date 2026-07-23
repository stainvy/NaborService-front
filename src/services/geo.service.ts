import { api } from '@/lib/api';
import type { GeoSuggestion, ResolveNeighbourhoodResult } from '@/types/geo';

export type { GeoSuggestion };

export const geoService = {
  /** Autocomplétion d'adresse via la BAN. */
  autocomplete(q: string, limit?: number): Promise<GeoSuggestion[]> {
    return api
      .get<GeoSuggestion[]>('/geo/autocomplete', { params: { q, limit } })
      .then((r) => r.data);
  },

  /** Résoudre un quartier depuis une adresse (l'API ne renvoie que l'id). */
  resolveNeighbourhood(q: string): Promise<ResolveNeighbourhoodResult> {
    return api
      .get<ResolveNeighbourhoodResult>('/geo/resolve-neighbourhood', { params: { q } })
      .then((r) => r.data);
  },
};
