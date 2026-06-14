export const socialKeys = {
  profile: (id: string) => ['users', 'public', id] as const,
  followers: (id: string) => ['users', id, 'followers'] as const,
  following: (id: string) => ['users', id, 'following'] as const,
  friends: (id: string) => ['users', id, 'friends'] as const,
  blocks: ['users', 'me', 'blocks'] as const,
  discover: ['users', 'discover'] as const,
  swipes: ['users', 'me', 'swipes'] as const,
};
