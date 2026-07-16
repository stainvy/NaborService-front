import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { chatService } from '@/services/chat.service';
import { chatKeys } from './queryKeys';
import type { ChatGroup } from '@/types/chat';

// Remet le badge non-lus à zéro localement (pas d'attente du round-trip
// réseau) puis confirme côté back — best-effort, silencieux en cas d'échec
// (le badge se re-synchronisera au prochain fetch de la liste des groupes).
export function useMarkGroupRead() {
  const queryClient = useQueryClient();
  return useCallback(
    (groupId: string) => {
      queryClient.setQueryData<ChatGroup[]>(chatKeys.groups, (old) =>
        old?.map((g) => (g.id === groupId ? { ...g, unread_count: 0 } : g)),
      );
      chatService.markGroupRead(groupId).catch(() => {});
    },
    [queryClient],
  );
}
