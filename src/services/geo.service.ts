import { api } from '@/lib/api';
import type { GeoSuggestion, Neighbourhood } from '@/types/geo';

export type { GeoSuggestion };

export const geoService = {
  /** Autocomplétion d'adresse via la BAN. */
  autocomplete(q: string, limit?: number): Promise<GeoSuggestion[]> {
    return api
      .get<GeoSuggestion[]>('/geo/autocomplete', { params: { q, limit } })
      .then((r) => r.data);
  },

  /** Résoudre un quartier depuis une adresse. */
  resolveNeighbourhood(q: string): Promise<Neighbourhood> {
    return api
      .get<Neighbourhood>('/geo/resolve-neighbourhood', { params: { q } })
      .then((r) => r.data);
  },
};
