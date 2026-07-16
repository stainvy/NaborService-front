import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getChatSocket } from '@/lib/socket';
import { patchMessageAcrossGroups } from './chatCache';

const EDIT_TIMEOUT_MS = 8000;

interface EditAck {
  status?: string;
  message_id?: string;
}

// Même schéma que useSendMessage : émission socket avec accusé de réception
// (le backend expose déjà `message:edit`, cf. chat.gateway.ts) ; la mise à
// jour du cache passe par `patchMessageAcrossGroups`, réutilisée par
// `useChatSocket` pour l'écho `message:edited` reçu par les autres clients.
export function useEditMessage() {
  const queryClient = useQueryClient();

  return useCallback((messageId: string, newContent: string): Promise<void> => {
    const trimmed = newContent.trim();
    return new Promise((resolve, reject) => {
      if (!trimmed) return reject(new Error('empty'));
      const socket = getChatSocket();
      if (!socket?.connected) return reject(new Error('disconnected'));

      const timeoutId = setTimeout(() => reject(new Error('timeout')), EDIT_TIMEOUT_MS);

      socket.emit('message:edit', { message_id: messageId, new_content: trimmed }, (ack: EditAck) => {
        clearTimeout(timeoutId);
        if (ack?.status !== 'edited') return reject(new Error(ack?.status ?? 'failed'));
        patchMessageAcrossGroups(queryClient, messageId, (msg) => ({
          ...msg,
          content: trimmed,
          edited_at: new Date().toISOString(),
        }));
        resolve();
      });
    });
  }, [queryClient]);
}
