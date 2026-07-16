import { api } from '@/lib/api';
import type { ChatGroup, ChatMessage, ChatGroupMember, ChatMessageAttachment, GroupRole, GroupSharedFile, MessagesPage, CreateGroupPayload } from '@/types/chat';

export type { ChatGroup, ChatMessage, ChatGroupMember, GroupSharedFile, MessagesPage, CreateGroupPayload };

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
  getMembers(groupId: string): Promise<ChatGroupMember[]> {
    return api.get<ChatGroupMember[]>(`/chat/groups/${groupId}/members`).then((r) => r.data);
  },

  /** Inviter un ou plusieurs membres — l'API n'accepte qu'un `user_id` à la fois (AddMemberDto), donc un appel par membre. */
  async addMember(groupId: string, memberIds: string[]): Promise<void> {
    await Promise.all(
      memberIds.map((user_id) => api.post(`/chat/groups/${groupId}/members`, { user_id })),
    );
  },

  /** Retirer un membre (ou quitter le groupe soi-même). */
  removeMember(groupId: string, userId: string): Promise<void> {
    return api.delete(`/chat/groups/${groupId}/members/${userId}`).then(() => undefined);
  },

  /** Modifier le rôle d'un membre. */
  updateMemberRole(groupId: string, userId: string, role: GroupRole): Promise<void> {
    return api.patch(`/chat/groups/${groupId}/members/${userId}`, { role }).then(() => undefined);
  },

  /** Mettre le groupe en sourdine (notifications). Sans durée : sourdine permanente. */
  muteGroup(groupId: string, durationMinutes?: number): Promise<void> {
    return api
      .post(`/chat/groups/${groupId}/mute`, durationMinutes ? { duration_minutes: durationMinutes } : {})
      .then(() => undefined);
  },

  /** Réactiver les notifications du groupe. */
  unmuteGroup(groupId: string): Promise<void> {
    return api.delete(`/chat/groups/${groupId}/mute`).then(() => undefined);
  },

  /**
   * Historique paginé des messages d'un groupe. `around` ancre la page sur
   * l'horodatage de ce message au lieu de "maintenant" — utilisé pour
   * charger le contexte d'un message pas encore présent dans le cache
   * (ex. saut vers un message épinglé ancien), en remplacement du curseur.
   * `direction: 'newer'` (avec `cursor`) comble le trou entre cette fenêtre
   * de contexte et le fil en direct, en repaginant vers le présent.
   */
  getMessages(
    groupId: string,
    cursor?: string,
    limit = 20,
    around?: string,
    direction?: 'older' | 'newer',
  ): Promise<MessagesPage> {
    return api
      .get<MessagesPage>(`/chat/groups/${groupId}/messages`, { params: { cursor, limit, around, direction } })
      .then((r) => r.data);
  },

  /** Messages épinglés du groupe — liste complète, indépendante de la pagination du fil. */
  getPinnedMessages(groupId: string): Promise<{ messages: ChatMessage[] }> {
    return api.get<{ messages: ChatMessage[] }>(`/chat/groups/${groupId}/pinned`).then((r) => r.data);
  },

  /** Fichiers partagés du groupe — toutes les pièces jointes, indépendantes de la pagination du fil. */
  getGroupAttachments(groupId: string): Promise<{ attachments: GroupSharedFile[] }> {
    return api.get<{ attachments: GroupSharedFile[] }>(`/chat/groups/${groupId}/attachments`).then((r) => r.data);
  },

  /** Détail d'un message. */
  getMessage(messageId: string): Promise<ChatMessage> {
    return api.get<ChatMessage>(`/chat/messages/${messageId}`).then((r) => r.data);
  },

  /** Supprimer un message (expéditeur ou admin). */
  deleteMessage(messageId: string): Promise<void> {
    return api.delete(`/chat/messages/${messageId}`).then(() => undefined);
  },

  /** Téléverse une pièce jointe pour un message déjà créé. */
  uploadAttachment(messageId: string, file: File): Promise<ChatMessageAttachment> {
    const form = new FormData();
    form.append('file', file);
    return api.post(`/media/messages/${messageId}/attachments`, form).then((r) => ({
      media_id: r.data._id,
      filename: r.data.original_filename,
      mimetype: r.data.mimetype,
      size_bytes: r.data.size_bytes,
    }));
  },

  /** Épingler un message (rôle actions ou admin dans le groupe). */
  pinMessage(messageId: string): Promise<ChatMessage> {
    return api.post<ChatMessage>(`/chat/messages/${messageId}/pin`).then((r) => r.data);
  },

  /** Désépingler un message. */
  unpinMessage(messageId: string): Promise<ChatMessage> {
    return api.delete<ChatMessage>(`/chat/messages/${messageId}/pin`).then((r) => r.data);
  },

  /** Marquer une conversation comme lue (remet le badge non-lus à zéro). */
  markGroupRead(groupId: string): Promise<void> {
    return api.post(`/chat/groups/${groupId}/read`).then(() => undefined);
  },
};
