export const adminKeys = {
  query: (collection: string, query: string) => ['admin', 'dsl', collection, query] as const,
};
