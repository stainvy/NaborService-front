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

export const adminService = {
  /** Lit un message déchiffré (contourne l'appartenance au groupe). */
  getMessage(messageId: string): Promise<AdminMessage> {
    return api.get<AdminMessage>(`/admin/messages/${messageId}`).then((r) => r.data);
  },

  /** Supprime un message (soft delete). */
  deleteMessage(messageId: string): Promise<void> {
    return api.delete(`/admin/messages/${messageId}`).then(() => undefined);
  },
};
