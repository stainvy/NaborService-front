import type { ListingFilters } from '../types';

export const listingKeys = {
  all: ['listings'] as const,
  list: (filters?: ListingFilters) => ['listings', 'list', filters] as const,
  detail: (id: string) => ['listings', 'detail', id] as const,
  content: (id: string) => ['listings', 'content', id] as const,
  chat: (id: string) => ['listings', 'chat', id] as const,
  contractStatus: (id: string) => ['listings', 'contract-status', id] as const,
  media: (id: string) => ['listings', 'media', id] as const,
  operations: (filters?: ListingFilters) => ['listings', 'operations', filters] as const,
  reported: (filters?: ListingFilters) => ['listings', 'reported', filters] as const,
  moderation: (id: string) => ['listings', 'moderation', id] as const,
  moderatedActions: (filters?: ListingFilters) =>
    ['listings', 'moderated-actions', filters] as const,
};

export const catalogKeys = {
  listingCategories: ['categories', 'listings'] as const,
  neighbourhoods: ['neighbourhoods'] as const,
};
