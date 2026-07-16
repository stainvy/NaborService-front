import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { chatService } from '@/services/chat.service';
import type { MessageType } from '@/types/chat';
import { useSendMessage } from './useSendMessage';
import { patchMessageAcrossGroups } from './chatCache';
import { chatKeys } from './queryKeys';

function typeFromMimetype(mimetype: string): MessageType {
  if (mimetype.startsWith('image/')) return 'image';
  if (mimetype.startsWith('audio/')) return 'voice';
  return 'file';
}

// Un fichier ne peut être attaché qu'à un message déjà créé (contrainte de
// l'API media) : on crée d'abord le message (via useSendMessage), puis on
// téléverse le fichier sur ce message, et on patche son `attachments` une
// fois l'upload terminé (échec d'upload distingué de l'échec d'envoi via
// `attachmentFailed`, message déjà créé dans les deux cas).
export function useSendAttachment(groupId: string) {
  const sendMessage = useSendMessage(groupId);
  const queryClient = useQueryClient();

  return useCallback(
    async (file: File, caption = '') => {
      const type = typeFromMimetype(file.type);
      const content = caption.trim() || file.name;
      const message = await sendMessage(content, type);
      if (!message) return;

      patchMessageAcrossGroups(queryClient, message.id, (msg) => ({ ...msg, attachmentUploading: true }));
      try {
        const attachment = await chatService.uploadAttachment(message.id, file);
        patchMessageAcrossGroups(queryClient, message.id, (msg) => ({
          ...msg,
          attachments: [...(msg.attachments ?? []), attachment],
          attachmentUploading: false,
        }));
        // Le panneau "fichiers partagés" est alimenté par un endpoint dédié
        // (useGroupAttachments), pas par le fil — on l'invalide pour que le
        // fichier tout juste envoyé y apparaisse sans recharger la page.
        queryClient.invalidateQueries({ queryKey: chatKeys.attachments(groupId) });
      } catch {
        patchMessageAcrossGroups(queryClient, message.id, (msg) => ({
          ...msg,
          attachmentUploading: false,
          attachmentFailed: true,
        }));
      }
    },
    [sendMessage, queryClient, groupId],
  );
}
