export const pollsKeys = {
  list: (neighbourhoodId?: string) => ['polls', 'list', neighbourhoodId ?? 'all'] as const,
  listByGroup: (groupId: string) => ['polls', 'list', 'group', groupId] as const,
  detail: (pollId: string) => ['polls', 'detail', pollId] as const,
  myVote: (pollId: string) => ['polls', 'myVote', pollId] as const,
};
