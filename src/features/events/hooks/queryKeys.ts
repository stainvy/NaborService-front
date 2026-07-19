import type { EventFilters } from '../types';

export const eventKeys = {
  all: ['events'] as const,
  list: (filters?: EventFilters) => ['events', 'list', filters] as const,
  operations: (filters?: EventFilters) => ['events', 'operations', filters] as const,
  registrations: (filters?: EventFilters) =>
    ['events', 'registrations', filters] as const,
  detail: (id: string) => ['events', 'detail', id] as const,
  content: (id: string) => ['events', 'content', id] as const,
  media: (id: string) => ['events', 'media', id] as const,
  participants: (id: string) => ['events', 'participants', id] as const,
  waitlist: (id: string) => ['events', 'waitlist', id] as const,
  chat: (id: string) => ['events', 'chat', id] as const,
};

export const eventCatalogKeys = {
  categories: ['categories', 'events'] as const,
};
