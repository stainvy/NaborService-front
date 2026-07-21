import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { chatService } from '@/services/chat.service';
import type { ChatGroup } from '@/types/chat';
import { chatKeys } from './queryKeys';

const CANDIDATE_SCAN_LIMIT = 20;

/**
 * Ouvre la conversation directe (direct_message) avec `targetUserId`.
 * Le back ne crée un groupe direct_message qu'automatiquement, quand deux
 * utilisateurs se suivent mutuellement (voir UserSocialService.follow) — il
 * n'y a pas de route pour en créer un à la demande. On ne peut donc appeler
 * `start` que si `profile.isFriend` est vrai : le groupe existe déjà et il
 * suffit de le retrouver (scan borné des groupes à 2 membres). Si on ne le
 * trouve pas malgré tout (retard de sync entre onglets, etc.), on échoue —
 * surtout ne pas créer un groupe de secours, il serait de type group_chat.
 */
export function useStartDirectChat() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isPending, setIsPending] = useState(false);
  const [isError, setIsError] = useState(false);

  const start = useCallback(
    async (targetUserId: string) => {
      setIsPending(true);
      setIsError(false);
      try {
        let groups = queryClient.getQueryData<ChatGroup[]>(chatKeys.groups);
        if (!groups) groups = await chatService.listGroups();
        const candidates = groups
          .filter((g) => g.type === 'direct_message' && g.member_count === 2)
          .slice(0, CANDIDATE_SCAN_LIMIT);

        for (const candidate of candidates) {
          const members = await chatService.getMembers(candidate.id);
          if (members.some((m) => m.user_id === targetUserId)) {
            navigate(`/chat/${candidate.id}`);
            return;
          }
        }

        setIsError(true);
      } finally {
        setIsPending(false);
      }
    },
    [queryClient, navigate],
  );

  return { start, isPending, isError };
}
