import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getChatSocket } from '@/lib/socket';
import { useAuth } from '@/hooks/useAuth';
import type { ChatMessage, MessageType } from '@/types/chat';
import { appendOrReconcileMessage, markMessageFailed, prependOptimisticMessage } from './chatCache';

const SEND_TIMEOUT_MS = 8000;

interface SendAck {
  status?: string;
  message?: ChatMessage;
}

interface ExceptionPayload {
  status?: string;
  message?: string;
}

// L'envoi passe uniquement par le socket (`message:send`) — il n'existe pas de
// route REST de création. Message affiché de façon optimiste, puis réconcilié
// dès que l'ack du serveur arrive (confirmation directe, plus fiable qu'un
// matching heuristique) ; `useChatSocket` réconcilie aussi via l'écho
// `message:received` (diffusé à tous les membres, y compris l'expéditeur) —
// les deux chemins convergent sans doublon puisqu'ils posent le même id final.
// En cas d'erreur serveur (droits, mute...), le gateway émet un événement
// `exception` global (non lié à cet envoi précis par un id de corrélation) ;
// on l'écoute ponctuellement le temps de cet envoi pour échouer immédiatement
// plutôt que d'attendre le timeout — au prix d'un risque mineur de faux
// positif si un autre envoi échoue pile pendant cette fenêtre.
//
// Renvoie une Promise<ChatMessage | null> (jamais rejetée — résout `null` sur
// échec/timeout, après avoir déjà appliqué le patch `failed` au cache) afin que
// les appelants "fire-and-forget" existants restent sûrs sans .catch, tout en
// permettant à useSendAttachment de chaîner dessus pour récupérer l'id du
// message nouvellement créé.
export function useSendMessage(groupId: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useCallback(
    (content: string, type: MessageType = 'text', parentMessageId?: string): Promise<ChatMessage | null> => {
      const trimmed = content.trim();
      if (!trimmed || !user) return Promise.resolve(null);
      const socket = getChatSocket();
      if (!socket?.connected) return Promise.resolve(null);

      const tempId = `temp-${crypto.randomUUID()}`;
      const optimistic: ChatMessage = {
        id: tempId,
        sender_id: user.id,
        sender: {
          id: user.id,
          first_name: user.firstName,
          last_name: user.lastName,
          profile_picture_mongo_id: user.profilePictureMongoId ?? null,
        },
        type,
        content: trimmed,
        sent_at: new Date().toISOString(),
        parent_message_id: parentMessageId ?? null,
        pending: true,
      };

      prependOptimisticMessage(queryClient, groupId, optimistic);

      return new Promise<ChatMessage | null>((resolve) => {
        let settled = false;
        const onException = (payload: ExceptionPayload) =>
          settle(() => {
            markMessageFailed(queryClient, groupId, tempId, payload?.message);
            resolve(null);
          });

        function settle(action: () => void) {
          if (settled) return;
          settled = true;
          clearTimeout(timeoutId);
          socket?.off('exception', onException);
          action();
        }

        const timeoutId = setTimeout(
          () => settle(() => {
            markMessageFailed(queryClient, groupId, tempId);
            resolve(null);
          }),
          SEND_TIMEOUT_MS,
        );
        socket.once('exception', onException);

        socket.emit(
          'message:send',
          { group_id: groupId, content: trimmed, type, parent_message_id: parentMessageId },
          (ack: SendAck) => {
            settle(() => {
              if (ack?.status === 'sent' && ack.message) {
                appendOrReconcileMessage(queryClient, groupId, ack.message, user.id);
                resolve(ack.message);
              } else {
                markMessageFailed(queryClient, groupId, tempId);
                resolve(null);
              }
            });
          },
        );
      });
    },
    [groupId, queryClient, user],
  );
}
