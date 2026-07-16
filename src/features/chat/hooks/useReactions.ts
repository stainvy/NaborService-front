import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getChatSocket } from '@/lib/socket';
import type { ChatMessageReaction } from '@/types/chat';
import { patchMessageAcrossGroups } from './chatCache';

const REACT_TIMEOUT_MS = 8000;

interface ReactAck {
  status?: string;
  reactions?: ChatMessageReaction[];
}

interface ExceptionPayload {
  status?: string;
  message?: string;
}

// Le filtre WS global (WsHttpExceptionFilter) n'invoque jamais l'ack en cas
// d'erreur serveur (rôle watch, message supprimé, etc.) : il émet un événement
// `exception` global à la place. Sans l'écouter ici, toute réaction refusée
// attendait bêtement le timeout de 8s en silence (indiscernable d'une réaction
// qui "ne marche pas du tout"). On écoute ponctuellement, comme useSendMessage.
function emitReaction(
  event: 'message:react' | 'message:unreact',
  payload: Record<string, unknown>,
  expectedStatus: string,
  onDone: (reactions: ChatMessageReaction[]) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const socket = getChatSocket();
    if (!socket?.connected) return reject(new Error('disconnected'));

    let settled = false;
    const onException = (payload: ExceptionPayload) => settle(() => reject(new Error(payload?.message ?? 'error')));

    function settle(action: () => void) {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutId);
      socket?.off('exception', onException);
      action();
    }

    const timeoutId = setTimeout(() => settle(() => reject(new Error('timeout'))), REACT_TIMEOUT_MS);
    socket.once('exception', onException);

    socket.emit(event, payload, (ack: ReactAck) => {
      settle(() => {
        if (ack?.status !== expectedStatus) return reject(new Error(ack?.status ?? 'failed'));
        onDone(ack.reactions ?? []);
        resolve();
      });
    });
  });
}

// Une seule réaction active par utilisateur et par message (choix produit
// verrouillé) — le backend remplace/écrase déjà côté serveur (message:react) ;
// le patch local applique directement le tableau `reactions` renvoyé, comme le
// fait useChatSocket pour l'écho `message:reaction_updated` reçu par les autres clients.
export function useReactToMessage() {
  const queryClient = useQueryClient();
  return useCallback(
    (messageId: string, emoji: string) =>
      emitReaction('message:react', { message_id: messageId, emoji }, 'reacted', (reactions) => {
        patchMessageAcrossGroups(queryClient, messageId, (msg) => ({ ...msg, reactions }));
      }),
    [queryClient],
  );
}

export function useUnreactToMessage() {
  const queryClient = useQueryClient();
  return useCallback(
    (messageId: string) =>
      emitReaction('message:unreact', { message_id: messageId }, 'unreacted', (reactions) => {
        patchMessageAcrossGroups(queryClient, messageId, (msg) => ({ ...msg, reactions }));
      }),
    [queryClient],
  );
}
