import { api } from '@/lib/api';
import type {
  Neighbourhood,
  CreateNeighbourhoodPayload,
  UpdateNeighbourhoodPayload,
} from '@/types/geo';

// ─── Public ────────────────────────────────────────────────

export const neighbourhoodsService = {
  /** Lister tous les quartiers. */
  listAll(): Promise<Neighbourhood[]> {
    return api.get<Neighbourhood[]>('/neighbourhoods').then((r) => r.data);
  },

  /** Quartiers proches d'un point GPS. */
  nearby(lat: number, lng: number, radius?: number): Promise<Neighbourhood[]> {
    return api
      .get<Neighbourhood[]>('/neighbourhoods/nearby', { params: { lat, lng, radius } })
      .then((r) => r.data);
  },

  /** Détail complet (Neo4j) avec géométrie et adjacences. */
  getDetail(neighbourhoodId: string): Promise<Neighbourhood> {
    return api
      .get<Neighbourhood>(`/neighbourhoods/${neighbourhoodId}`)
      .then((r) => r.data);
  },

  /** Habitants du quartier. */
  getMembers(neighbourhoodId: string): Promise<unknown[]> {
    return api.get(`/neighbourhoods/${neighbourhoodId}/members`).then((r) => r.data);
  },

  /** Quartiers adjacents (niveau 1). */
  getAdjacent(neighbourhoodId: string): Promise<Neighbourhood[]> {
    return api
      .get<Neighbourhood[]>(`/neighbourhoods/${neighbourhoodId}/adjacent`)
      .then((r) => r.data);
  },

  // ─── Admin ──────────────────────────────────────────────

  /** Lister tous les quartiers (GeoJSON complet, admin). */
  adminList(): Promise<Neighbourhood[]> {
    return api.get<Neighbourhood[]>('/admin/neighbourhoods').then((r) => r.data);
  },

  /** Créer un quartier. */
  create(payload: CreateNeighbourhoodPayload): Promise<Neighbourhood> {
    return api.post<Neighbourhood>('/admin/neighbourhoods', payload).then((r) => r.data);
  },

  /** Modifier un quartier. */
  update(id: string, payload: UpdateNeighbourhoodPayload): Promise<Neighbourhood> {
    return api.patch<Neighbourhood>(`/admin/neighbourhoods/${id}`, payload).then((r) => r.data);
  },

  /** Supprimer un quartier. */
  delete(id: string): Promise<void> {
    return api.delete(`/admin/neighbourhoods/${id}`).then(() => undefined);
  },

  /** Vérifier les superpositions pour une géométrie candidate. */
  overlapCheck(geometry: GeoJSON.Polygon): Promise<unknown> {
    return api.post('/admin/neighbourhoods/overlap-check', { geometry }).then((r) => r.data);
  },

  /** Déclencher une réconciliation géographique. */
  reconcile(): Promise<unknown> {
    return api.post('/admin/neighbourhoods/reconcile').then((r) => r.data);
  },
};
