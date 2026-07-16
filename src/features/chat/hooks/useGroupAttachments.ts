import { useQuery } from '@tanstack/react-query';
import { chatService } from '@/services/chat.service';
import { chatKeys } from './queryKeys';

// Liste complète des fichiers partagés d'un groupe (endpoint dédié GET
// /chat/groups/:id/attachments) — indépendante de la pagination du fil : un
// fichier ancien, hors de la première page chargée, doit quand même apparaître
// dans le panneau "fichiers partagés". Invalidée à l'envoi d'une pièce jointe
// (useSendAttachment) et à la réception socket d'un message qui en porte une.
export function useGroupAttachments(groupId: string | undefined) {
  return useQuery({
    queryKey: chatKeys.attachments(groupId ?? ''),
    queryFn: () => chatService.getGroupAttachments(groupId!).then((r) => r.attachments),
    enabled: Boolean(groupId),
  });
}
