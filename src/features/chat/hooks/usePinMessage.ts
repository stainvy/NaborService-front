import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getChatSocket } from '@/lib/socket';
import { chatService } from '@/services/chat.service';
import type { ChatMessage } from '@/types/chat';
import { patchMessageAcrossGroups } from './chatCache';
import { chatKeys } from './queryKeys';

const PIN_TIMEOUT_MS = 8000;

interface PinAck {
  status?: string;
  message?: ChatMessage;
}

interface ExceptionPayload {
  status?: string;
  message?: string;
}

// Même schéma que useReactions/useEditMessage : émission socket avec accusé de
// réception (chat.gateway.ts expose déjà message:pin/message:unpin, gérés côté
// service par un contrôle de rôle groupe actions/admin). Le patch de cache
// s'applique au message complet renvoyé par l'ack, réutilisé par useChatSocket
// pour l'écho message:pinned/message:unpinned reçu par les autres clients.
function emitPin(
  event: 'message:pin' | 'message:unpin',
  messageId: string,
  expectedStatus: string,
  onDone: (message: ChatMessage) => void,
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

    const timeoutId = setTimeout(() => settle(() => reject(new Error('timeout'))), PIN_TIMEOUT_MS);
    socket.once('exception', onException);

    socket.emit(event, { message_id: messageId }, (ack: PinAck) => {
      settle(() => {
        if (ack?.status !== expectedStatus || !ack.message) return reject(new Error(ack?.status ?? 'failed'));
        onDone(ack.message);
        resolve();
      });
    });
  });
}

export function usePinMessage() {
  const queryClient = useQueryClient();
  return useCallback(
    (messageId: string) =>
      emitPin('message:pin', messageId, 'pinned', (message) => {
        patchMessageAcrossGroups(queryClient, messageId, () => message);
        if (message.group_id) queryClient.invalidateQueries({ queryKey: chatKeys.pinned(message.group_id) });
      }),
    [queryClient],
  );
}

export function useUnpinMessage() {
  const queryClient = useQueryClient();
  return useCallback(
    (messageId: string) =>
      emitPin('message:unpin', messageId, 'unpinned', (message) => {
        patchMessageAcrossGroups(queryClient, messageId, () => message);
        if (message.group_id) queryClient.invalidateQueries({ queryKey: chatKeys.pinned(message.group_id) });
      }),
    [queryClient],
  );
}

/** Liste des messages épinglés du groupe (indépendante de la pagination du fil). */
export function usePinnedMessages(groupId: string | undefined) {
  return useQuery({
    queryKey: chatKeys.pinned(groupId ?? ''),
    queryFn: () => chatService.getPinnedMessages(groupId!).then((r) => r.messages),
    enabled: Boolean(groupId),
  });
}
