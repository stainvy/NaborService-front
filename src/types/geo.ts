/** Résultat de résolution d'une adresse en quartier (ne renvoie que l'id). */
export interface ResolveNeighbourhoodResult {
  neighbourhoodId: string;
  method: string;
}

/** Suggestion d'adresse retournée par la BAN. */
export interface GeoSuggestion {
  label: string;
  latitude: number;
  longitude: number;
  city?: string;
  postcode?: string;
}

/** Quartier (Neo4j + PostgreSQL) — réponse API en camelCase. */
export interface Neighbourhood {
  pgId: string;
  name: string;
  city: string;
  zipCode: string;
  country: string;
  geometry?: GeoJSON.Polygon;
  centroid?: { latitude: number; longitude: number };
  areaM2?: number;
  memberCount?: number;
  adjacentPgIds?: string[];
}

/** Payload création quartier (admin). */
export interface CreateNeighbourhoodPayload {
  pg_id: string;
  name: string;
  city: string;
  zip_code: string;
  country: string;
  geometry: GeoJSON.Polygon;
}

/** Payload modification quartier (admin). */
export interface UpdateNeighbourhoodPayload {
  name?: string;
  city?: string;
  zip_code?: string;
  country?: string;
  geometry?: GeoJSON.Polygon;
}
