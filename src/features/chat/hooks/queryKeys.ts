export const chatKeys = {
  groups: ['chat', 'groups'] as const,
  group: (groupId: string) => ['chat', 'groups', groupId] as const,
  members: (groupId: string) => ['chat', 'groups', groupId, 'members'] as const,
  messages: (groupId: string) => ['chat', 'groups', groupId, 'messages'] as const,
  message: (messageId: string) => ['chat', 'message', messageId] as const,
  pinned: (groupId: string) => ['chat', 'groups', groupId, 'pinned'] as const,
  attachments: (groupId: string) => ['chat', 'groups', groupId, 'attachments'] as const,
};
