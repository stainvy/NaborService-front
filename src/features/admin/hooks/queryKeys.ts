export const adminKeys = {
  query: (collection: string, query: string) => ['admin', 'dsl', collection, query] as const,
  audit: (offset: number, limit: number) => ['admin', 'dsl', 'audit', offset, limit] as const,
  groups: ['admin', 'chat', 'groups'] as const,
  groupMessages: (groupId: string) => ['admin', 'chat', 'groups', groupId, 'messages'] as const,
  message: (id: string) => ['admin', 'chat', 'messages', id] as const,
  users: (params?: unknown) => ['admin', 'users', params] as const,
  user: (id: string) => ['admin', 'users', id] as const,
  config: ['admin', 'config'] as const,
  rgpdRequests: (params?: unknown) => ['admin', 'rgpd', 'requests', params] as const,
  rgpdRequestStatus: (uid: string) => ['admin', 'rgpd', 'requests', uid, 'status'] as const,
  statsOverview: ['admin', 'stats', 'overview'] as const,
  statsListings: ['admin', 'stats', 'listings'] as const,
  statsEvents: ['admin', 'stats', 'events'] as const,
  statsPayments: ['admin', 'stats', 'payments'] as const,
  statsUsers: ['admin', 'stats', 'users'] as const,
  statsIncidents: ['admin', 'stats', 'incidents'] as const,
};

export const moderationKeys = {
  reportedListings: (params?: unknown) => ['moderation', 'listings', 'reported', params] as const,
  listingActions: (params?: unknown) => ['moderation', 'listings', 'actions', params] as const,
  listingHistory: (id: string) => ['moderation', 'listings', id, 'history'] as const,
  reportedEvents: (params?: unknown) => ['moderation', 'events', 'reported', params] as const,
  eventActions: (params?: unknown) => ['moderation', 'events', 'actions', params] as const,
  eventHistory: (id: string) => ['moderation', 'events', id, 'history'] as const,
};

export const incidentKeys = {
  list: (params?: unknown) => ['incidents', 'list', params] as const,
  detail: (id: string) => ['incidents', id] as const,
};

export const geoKeys = {
  autocomplete: (q: string) => ['admin', 'geo', 'autocomplete', q] as const,
  resolve: (q: string) => ['admin', 'geo', 'resolve', q] as const,
  nearby: (lat: number, lng: number, radius: number) => ['admin', 'geo', 'nearby', lat, lng, radius] as const,
  neighbourhoods: ['admin', 'neighbourhoods', 'browse'] as const,
  neighbourhoodsAdmin: ['admin', 'neighbourhoods', 'admin'] as const,
  members: (id: string) => ['admin', 'neighbourhoods', id, 'members'] as const,
  adjacent: (id: string) => ['admin', 'neighbourhoods', id, 'adjacent'] as const,
};
