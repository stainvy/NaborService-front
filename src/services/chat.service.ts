import { api } from '@/lib/api';

// --- Types ---

export interface ChatGroup {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  member_count?: number;
  [key: string]: unknown;
}

export interface ChatMessage {
  id: string;
  pg_message_id?: string;
  pg_sender_id: string;
  type: 'text' | 'image' | 'file' | 'voice';
  content?: string;
  sent_at: string;
  edited_at?: string;
  deleted_at?: string;
  attachments?: { filename: string; mimetype: string; size_bytes: number }[];
  reactions?: { pg_user_id: string; emoji: string }[];
  [key: string]: unknown;
}

export interface CreateGroupPayload {
  name: string;
  description?: string;
  memberIds?: string[];
}

// --- Service ---

export const chatService = {
  /** Liste les groupes de l'utilisateur connecté. */
  listGroups(): Promise<ChatGroup[]> {
    return api.get<ChatGroup[]>('/chat/groups').then((r) => r.data);
  },

  /** Créer un groupe. */
  createGroup(payload: CreateGroupPayload): Promise<ChatGroup> {
    return api.post<ChatGroup>('/chat/groups', payload).then((r) => r.data);
  },

  /** Détail d'un groupe. */
  getGroup(groupId: string): Promise<ChatGroup> {
    return api.get<ChatGroup>(`/chat/groups/${groupId}`).then((r) => r.data);
  },

  /** Modifier nom/description d'un groupe. */
  updateGroup(groupId: string, payload: { name?: string; description?: string }): Promise<ChatGroup> {
    return api.patch<ChatGroup>(`/chat/groups/${groupId}`, payload).then((r) => r.data);
  },

  /** Supprimer un groupe. */
  deleteGroup(groupId: string): Promise<void> {
    return api.delete(`/chat/groups/${groupId}`).then(() => undefined);
  },

  /** Membres d'un groupe. */
  getMembers(groupId: string): Promise<unknown[]> {
    return api.get(`/chat/groups/${groupId}/members`).then((r) => r.data);
  },

  /** Inviter un membre. */
  addMember(groupId: string, memberIds: string[]): Promise<void> {
    return api.post(`/chat/groups/${groupId}/members`, { memberIds }).then(() => undefined);
  },

  /** Retirer un membre. */
  removeMember(groupId: string, userId: string): Promise<void> {
    return api.delete(`/chat/groups/${groupId}/members/${userId}`).then(() => undefined);
  },

  /** Historique paginé des messages d'un groupe. */
  getMessages(groupId: string, cursor?: string, limit = 20): Promise<{ messages: ChatMessage[]; next_cursor?: string }> {
    return api.get(`/chat/groups/${groupId}/messages`, { params: { cursor, limit } }).then((r) => r.data);
  },

  /** Détail d'un message. */
  getMessage(messageId: string): Promise<ChatMessage> {
    return api.get<ChatMessage>(`/chat/messages/${messageId}`).then((r) => r.data);
  },

  /** Supprimer un message (expéditeur ou admin). */
  deleteMessage(messageId: string): Promise<void> {
    return api.delete(`/chat/messages/${messageId}`).then(() => undefined);
  },
};
