import { api } from '@/lib/api';

// --- Types ---

export interface DslQueryRequest {
  query: string;
  collection?: string;
}

export interface DslQueryResult {
  collection: string;
  filter: Record<string, unknown>;
  order: Record<string, unknown> | null;
  limit: number;
  projection: Record<string, unknown>;
  documents?: Record<string, unknown>[];
  total?: number;
}

/** Format réel de l'API dsl/audit (NestJS → Python FastAPI). */
interface DslAuditEntryRaw {
  id: string;
  userId: string;
  userRole: string;
  query: string;
  collection: string;
  filter: Record<string, unknown> | null;
  order: Record<string, unknown> | null;
  limit: number;
  resultCount: number | null;
  hasError: boolean;
  errorMessage: string | null;
  ipAddress: string;
  createdAt: string;
}

/** Entrée normalisée pour l'UI. */
export interface DslAuditEntry {
  id: string;
  userId: string;
  userRole: string;
  query: string;
  collection: string;
  filter: Record<string, unknown> | null;
  limit: number;
  resultCount: number | null;
  success: boolean;
  errorMessage: string | null;
  ipAddress: string;
  createdAt: string;
}

export interface DslAuditResponse {
  entries: DslAuditEntry[];
  total: number;
}

// --- Normalisation ---

function normalizeEntry(raw: DslAuditEntryRaw): DslAuditEntry {
  return {
    id: raw.id,
    userId: raw.userId,
    userRole: raw.userRole,
    query: raw.query,
    collection: raw.collection,
    filter: raw.filter,
    limit: raw.limit,
    resultCount: raw.resultCount,
    success: !raw.hasError,
    errorMessage: raw.errorMessage,
    ipAddress: raw.ipAddress,
    createdAt: raw.createdAt,
  };
}

// --- Service ---

export const dslService = {
  /** Exécute une requête DSL et retourne le filtre MongoDB généré. */
  executeQuery(payload: DslQueryRequest): Promise<DslQueryResult> {
    return api.post<DslQueryResult>('/dsl/query', payload).then((r) => r.data);
  },

  /** Historique paginé des requêtes DSL exécutées (admin only). */
  async getAudit(offset = 0, limit = 50): Promise<DslAuditResponse> {
    const res = await api.get<{ entries: DslAuditEntryRaw[]; total: number }>(
      '/dsl/audit',
      { params: { offset, limit } },
    );
    return {
      entries: (res.data.entries ?? []).map(normalizeEntry),
      total: res.data.total ?? 0,
    };
  },
};
