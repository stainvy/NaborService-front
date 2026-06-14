import { api } from '@/lib/api';

// Service géo (routes publiques). Sert à déterminer un neighbourhoodId à partir
// d'une adresse.
//
// ⚠️ NON FONCTIONNEL en local au moment de l'écriture (sondé en direct) :
// - GET /geo/autocomplete?q= exige `q` mais renvoie toujours [] (provider géo
//   externe non configuré sur le back local) ;
// - GET /geo/resolve-neighbourhood?q= renvoie 500.
// Les formes des items ne sont donc pas confirmées. Le sélecteur de quartier
// est reporté au module Quartiers (cf. note dans le prompt). On garde le service
// câblé sur le contrat documenté pour y brancher l'UI quand le back sera prêt.

// Forme des suggestions non confirmée (réponses vides au sondage).
export type GeoSuggestion = Record<string, unknown>;

export const geoService = {
  autocomplete(q: string, limit?: number): Promise<GeoSuggestion[]> {
    return api
      .get<GeoSuggestion[]>('/geo/autocomplete', { params: { q, limit } })
      .then((r) => r.data);
  },

  resolveNeighbourhood(q: string): Promise<GeoSuggestion> {
    return api
      .get<GeoSuggestion>('/geo/resolve-neighbourhood', { params: { q } })
      .then((r) => r.data);
  },
};
