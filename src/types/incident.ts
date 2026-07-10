// Shape confirmée via /api-json (CreateIncidentDto/UpdateIncidentDto/AssignIncidentDto)
// + le schéma PostgreSQL `incidents` du cahier des charges (table incidents, §3.1).
// Aucune réponse GET n'est documentée côté Swagger — les champs ci-dessous suivent
// la même sérialisation camelCase que les autres entités (Listing, NaborEvent, User).

export const INCIDENT_SEVERITIES = ['low', 'medium', 'high', 'critical'] as const;
export type IncidentSeverity = (typeof INCIDENT_SEVERITIES)[number];

export const INCIDENT_STATUSES = ['open', 'in_progress', 'resolved'] as const;
export type IncidentStatus = (typeof INCIDENT_STATUSES)[number];

export interface Incident {
  id: string;
  reporterId: string;
  assignedTo?: string | null;
  neighbourhoodId?: string | null;
  mongoDocumentId?: string | null;
  title: string;
  description?: string | null;
  severity: IncidentSeverity;
  status: IncidentStatus;
  assignedAt?: string | null;
  createdAt: string;
  updatedAt?: string | null;
  resolvedAt?: string | null;
  // Enrichissement MongoDB (`incident_documents`) — présence non confirmée sur la
  // réponse REST fusionnée, accès défensif dans l'UI.
  locationHint?: string | null;
  photos?: { mediaId?: string; mimetype?: string; takenAt?: string }[];
  [key: string]: unknown;
}

export interface CreateIncidentPayload {
  title: string;
  description?: string;
  neighbourhood_id?: string;
  severity?: IncidentSeverity;
}

export interface UpdateIncidentPayload {
  title?: string;
  description?: string;
  severity?: IncidentSeverity;
}

export interface IncidentsQuery {
  neighbourhood_id?: string;
  status?: IncidentStatus;
  severity?: IncidentSeverity;
  offset?: number;
  limit?: number;
}
