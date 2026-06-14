// Enveloppe de pagination du back (confirmée en direct sur le Swagger) :
// { data: [...], meta: { total, offset, limit } }
export interface Paginated<T> {
  data: T[];
  meta: {
    total: number;
    offset: number;
    limit: number;
  };
}

export interface PageParams {
  offset?: number;
  limit?: number;
}
