export type MessageType = 'text' | 'image' | 'file' | 'voice' | 'poll' | 'system';

export interface ChatGroupParticipant {
  id: string;
  first_name: string;
  last_name: string;
  profile_picture_mongo_id: string | null;
}

export interface ChatGroup {
  id: string;
  name: string | null;
  description?: string;
  type?: 'direct_message' | 'group_chat' | 'neighbourhood';
  /** Quartier associé — renseigné uniquement pour les groupes de type "neighbourhood". */
  neighbourhoodId?: string | null;
  created_at: string;
  updated_at: string;
  member_count: number;
  other_participant?: ChatGroupParticipant | null;
  is_muted?: boolean;
  /** Rôle de l'utilisateur connecté dans ce groupe (absent hors contexte utilisateur, ex. vues admin). */
  my_role?: GroupRole | null;
  /** Nombre de messages non lus par l'utilisateur connecté dans cette conversation. */
  unread_count?: number;
  [key: string]: unknown;
}

export type GroupRole = 'watch' | 'message' | 'actions' | 'admin';

export interface ChatGroupMember {
  user_id: string;
  role: GroupRole;
  joined_at: string;
  first_name: string | null;
  last_name: string | null;
  profile_picture_mongo_id: string | null;
  [key: string]: unknown;
}

export interface ChatMessageAttachment {
  media_id: string;
  filename: string;
  mimetype: string;
  size_bytes: number;
  /** Renseigné pour les pièces jointes audio — probé côté back, ne dépend pas du navigateur. */
  duration_seconds?: number | null;
}

/** Fichier partagé renvoyé par GET /chat/groups/:id/attachments — pièce jointe + message d'origine (pour le saut). */
export interface GroupSharedFile {
  message_id: string;
  sender_id: string | null;
  sent_at: string | null;
  media_id: string;
  filename: string;
  mimetype: string;
  size_bytes: number;
  uploaded_at: string;
}

export interface ChatMessageReaction {
  pg_user_id: string;
  emoji: string;
  reacted_at?: string;
}

export interface ChatMessageParentPreview {
  id: string;
  sender_id: string;
  sender: ChatGroupParticipant | null;
  content: string | null;
  is_deleted: boolean;
}

export interface ChatMessage {
  id: string;
  pg_message_id?: string;
  /** Groupe propriétaire — toujours renvoyé par le back, absent seulement sur un message optimiste local. */
  group_id?: string;
  sender_id: string;
  /** Identité de l'expéditeur (résolue côté back — évite un lookup client par id). */
  sender?: ChatGroupParticipant | null;
  type: MessageType;
  content?: string;
  sent_at: string;
  edited_at?: string;
  deleted_at?: string;
  parent_message_id?: string | null;
  /** Aperçu du message auquel on répond (contenu + expéditeur), fourni par le back. */
  parent_message?: ChatMessageParentPreview | null;
  attachments?: ChatMessageAttachment[];
  reactions?: ChatMessageReaction[];
  /** Renseigné quand type === 'poll' — id du sondage affiché dans ce message. */
  poll_id?: string | null;
  /** Renseignés quand type === 'system' — nom d'événement + charge utile libre (ex. appel manqué/terminé). */
  system_event?: string | null;
  system_payload?: Record<string, unknown> | null;
  pinned?: boolean;
  pinned_at?: string | null;
  pinned_by?: string | null;
  // État local uniquement (jamais renvoyé par l'API) — message envoyé de manière
  // optimiste, en attente de l'écho `message:received`.
  pending?: boolean;
  failed?: boolean;
  // Raison renvoyée par le serveur (événement `exception`) quand disponible ;
  // absente pour un échec par timeout silencieux (ex. connexion perdue).
  failReason?: string;
  // Pièce jointe en cours d'envoi côté client (avant confirmation de l'upload).
  attachmentUploading?: boolean;
  attachmentFailed?: boolean;
  [key: string]: unknown;
}

export interface MessagesPage {
  messages: ChatMessage[];
  has_more?: boolean;
  // Nom du champ aligné sur la réponse réelle du back (`chat-message.service.ts`
  // renvoie `cursor`, jamais `next_cursor`) — l'ancien nom faisait toujours
  // planter la pagination "charger plus ancien" (getNextPageParam lisait un
  // champ toujours undefined, donc hasNextPage restait faux en permanence).
  cursor?: string;
  // Pagination "plus récent" — seulement renseigné pour une page ancrée par
  // `around` (jump-to-message) ou une page déjà chargée en direction "newer" ;
  // comble le trou entre une fenêtre de contexte et le fil en direct.
  has_more_newer?: boolean;
  newer_cursor?: string;
}

export interface CreateGroupPayload {
  name: string;
  description?: string;
  memberIds?: string[];
}
