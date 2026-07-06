import { api } from '@/lib/api';

export interface AdminMessage {
  id: string;
  pg_message_id: string;
  pg_group_id: string;
  pg_sender_id: string;
  type: 'text' | 'image' | 'file' | 'voice';
  content?: string; // déchiffré par le serveur avec la clé admin
  sent_at: string;
  edited_at?: string;
  deleted_at?: string;
  attachments?: { filename: string; mimetype: string; size_bytes: number }[];
  reactions?: { pg_user_id: string; emoji: string }[];
}

export interface AdminGroup {
  id: string;
  name: string;
  type: string;
  createdBy: string;
  createdAt: string;
  memberCount: number;
}

export const adminService = {
  /** Liste tous les groupes (admin). */
  listGroups(): Promise<AdminGroup[]> {
    return api.get<AdminGroup[]>('/admin/chat/groups').then((r) => r.data);
  },

  /** Historique des messages d'un groupe (admin, contourne l'appartenance). */
  getGroupMessages(groupId: string, limit?: number): Promise<unknown[]> {
    return api
      .get(`/admin/chat/groups/${groupId}/messages`, { params: { limit } })
      .then((r) => r.data);
  },

  /** Lit un message déchiffré (contourne l'appartenance au groupe). */
  getMessage(messageId: string): Promise<AdminMessage> {
    return api.get<AdminMessage>(`/admin/chat/messages/${messageId}`).then((r) => r.data);
  },

  /** Supprime un message (soft delete). */
  deleteMessage(messageId: string): Promise<void> {
    return api.delete(`/admin/chat/messages/${messageId}`).then(() => undefined);
  },
};
