import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getChatSocket } from '@/lib/socket';
import { useAuth } from '@/hooks/useAuth';
import type { ChatMessage, ChatMessageReaction } from '@/types/chat';
import { appendOrReconcileMessage, patchMessageAcrossGroups } from './chatCache';
import { chatKeys } from './queryKeys';

type ReceivedMessagePayload = ChatMessage;
interface EditedMessagePayload {
  message_id: string;
  content?: string;
  new_content?: string;
  edited_at?: string;
}
interface DeletedMessagePayload {
  message_id: string;
  deleted_at?: string;
}
interface ReadAckPayload {
  message_id: string;
  read_at?: string;
}
interface ReactionUpdatedPayload {
  message_id: string;
  reactions: ChatMessageReaction[];
}
interface TypingPayload {
  group_id: string;
  user_id: string;
}
type PinnedMessagePayload = ChatMessage;

/**
 * Rejoint/quitte la room du groupe actif et écoute les événements temps réel
 * du namespace /chat. À appeler une fois par thread ouvert (ex. dans ConversationThread) ;
 * les listeners restent attachés tant que le composant appelant est monté.
 */
export function useChatSocket(
  activeGroupId: string | undefined,
  options: { suppressLiveMessages?: boolean } = {},
) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [typingUsers, setTypingUsers] = useState<Record<string, string[]>>({});

  const activeGroupIdRef = useRef(activeGroupId);
  activeGroupIdRef.current = activeGroupId;
  const userIdRef = useRef(user?.id);
  userIdRef.current = user?.id;
  // Vrai pendant qu'on consulte une fenêtre de contexte (jump-to-message,
  // pas encore rattrapée jusqu'au direct) — voir onReceived ci-dessous.
  const suppressLiveMessagesRef = useRef(options.suppressLiveMessages ?? false);
  suppressLiveMessagesRef.current = options.suppressLiveMessages ?? false;

  // Appartenance à la room : rejoint/quitte quand le thread actif change.
  useEffect(() => {
    if (!activeGroupId) return;
    const socket = getChatSocket();
    socket?.emit('join_group', { group_id: activeGroupId });
    return () => {
      socket?.emit('leave_group', { group_id: activeGroupId });
    };
  }, [activeGroupId]);

  // Listeners attachés une fois ; lisent l'état courant via des refs.
  useEffect(() => {
    const socket = getChatSocket();
    if (!socket) return;

    function onReceived(payload: ReceivedMessagePayload) {
      const groupId = payload.group_id ?? activeGroupIdRef.current;
      if (!groupId) return;
      // Le cache affiché n'est alors pas la fin réelle du fil (fenêtre
      // ancrée sur un jump-to-message) — préfixer ce message dessus le
      // placerait à tort juste après cette fenêtre au lieu de "maintenant".
      // Il redevient visible normalement une fois de retour au direct
      // (rechargement complet, pas de perte).
      if (suppressLiveMessagesRef.current) return;
      appendOrReconcileMessage(queryClient, groupId, payload, userIdRef.current);
      // Le panneau "fichiers partagés" vient d'un endpoint dédié, pas du fil :
      // un message reçu avec pièce jointe doit l'y faire apparaître aussitôt.
      if (payload.attachments && payload.attachments.length > 0) {
        queryClient.invalidateQueries({ queryKey: chatKeys.attachments(groupId) });
      }
    }

    function onEdited(payload: EditedMessagePayload) {
      patchMessageAcrossGroups(queryClient, payload.message_id, (msg) => ({
        ...msg,
        content: payload.new_content ?? payload.content ?? msg.content,
        edited_at: payload.edited_at ?? new Date().toISOString(),
      }));
    }

    function onDeleted(payload: DeletedMessagePayload) {
      // Diffusion serveur-wide, non limitée à la room : on ne patche que si le
      // message existe dans un cache déjà en mémoire (défensif).
      patchMessageAcrossGroups(queryClient, payload.message_id, (msg) => ({
        ...msg,
        deleted_at: payload.deleted_at ?? new Date().toISOString(),
        content: undefined,
      }));
    }

    function onReadAck(payload: ReadAckPayload) {
      patchMessageAcrossGroups(queryClient, payload.message_id, (msg) => ({
        ...msg,
        read_at: payload.read_at ?? new Date().toISOString(),
      }));
    }

    function onReactionUpdated(payload: ReactionUpdatedPayload) {
      patchMessageAcrossGroups(queryClient, payload.message_id, (msg) => ({
        ...msg,
        reactions: payload.reactions,
      }));
    }

    function onPinChanged(payload: PinnedMessagePayload) {
      patchMessageAcrossGroups(queryClient, payload.id, () => payload);
      if (payload.group_id) queryClient.invalidateQueries({ queryKey: chatKeys.pinned(payload.group_id) });
    }

    function onTyping(payload: TypingPayload) {
      setTypingUsers((prev) => {
        const current = prev[payload.group_id] ?? [];
        if (current.includes(payload.user_id)) return prev;
        return { ...prev, [payload.group_id]: [...current, payload.user_id] };
      });
    }

    function onTypingStop(payload: TypingPayload) {
      setTypingUsers((prev) => {
        const current = prev[payload.group_id];
        if (!current) return prev;
        return { ...prev, [payload.group_id]: current.filter((id) => id !== payload.user_id) };
      });
    }

    socket.on('message:received', onReceived);
    socket.on('message:edited', onEdited);
    socket.on('message:deleted', onDeleted);
    socket.on('message:read_ack', onReadAck);
    socket.on('message:reaction_updated', onReactionUpdated);
    socket.on('message:pinned', onPinChanged);
    socket.on('message:unpinned', onPinChanged);
    socket.on('typing', onTyping);
    socket.on('typing:stop', onTypingStop);

    return () => {
      socket.off('message:received', onReceived);
      socket.off('message:edited', onEdited);
      socket.off('message:deleted', onDeleted);
      socket.off('message:read_ack', onReadAck);
      socket.off('message:reaction_updated', onReactionUpdated);
      socket.off('message:pinned', onPinChanged);
      socket.off('message:unpinned', onPinChanged);
      socket.off('typing', onTyping);
      socket.off('typing:stop', onTypingStop);
    };
  }, [queryClient]);

  return { typingUsers };
}
