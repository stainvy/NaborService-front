import { api } from '@/lib/api';
import type {
  Incident,
  CreateIncidentPayload,
  UpdateIncidentPayload,
  IncidentsQuery,
} from '@/types/incident';
import type { Paginated } from '@/types/pagination';

export const incidentsService = {
  // GET /incidents -> Paginated<Incident> { data, meta: { total, offset, limit } }
  list(params?: IncidentsQuery): Promise<Paginated<Incident>> {
    return api.get<Paginated<Incident>>('/incidents', { params }).then((r) => r.data);
  },

  getById(id: string): Promise<Incident> {
    return api.get<Incident>(`/incidents/${id}`).then((r) => r.data);
  },

  create(payload: CreateIncidentPayload): Promise<Incident> {
    return api.post<Incident>('/incidents', payload).then((r) => r.data);
  },

  update(id: string, payload: UpdateIncidentPayload): Promise<Incident> {
    return api.patch<Incident>(`/incidents/${id}`, payload).then((r) => r.data);
  },

  delete(id: string): Promise<void> {
    return api.delete(`/incidents/${id}`).then(() => undefined);
  },

  /** Assigne l'incident ; sans `assigneeId`, le modérateur s'auto-assigne (back). */
  assign(id: string, assigneeId?: string): Promise<Incident> {
    return api.post<Incident>(`/incidents/${id}/assign`, assigneeId ? { assignee_id: assigneeId } : {}).then((r) => r.data);
  },

  resolve(id: string): Promise<Incident> {
    return api.post<Incident>(`/incidents/${id}/resolve`).then((r) => r.data);
  },

  uploadPhoto(id: string, file: File): Promise<{ mediaId?: string; id?: string }> {
    const form = new FormData();
    form.append('file', file);
    return api.post(`/media/incidents/${id}/photos`, form).then((r) => r.data);
  },
};
