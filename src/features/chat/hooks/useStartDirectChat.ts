import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { chatService } from '@/services/chat.service';
import { useAuth } from '@/hooks/useAuth';
import type { ChatGroup } from '@/types/chat';
import { chatKeys } from './queryKeys';

const CANDIDATE_SCAN_LIMIT = 20;

/**
 * Ouvre une conversation directe existante avec `targetUserId` si elle existe
 * déjà (scan borné des groupes à 2 membres), sinon en crée une nouvelle.
 * Heuristique côté client, pas garantie contre les doublons en cas de course
 * entre deux onglets — acceptable pour v1 (voir plan).
 */
export function useStartDirectChat() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isPending, setIsPending] = useState(false);

  const start = useCallback(
    async (targetUserId: string, targetFirstName: string) => {
      setIsPending(true);
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

        const name = user ? `${user.firstName} & ${targetFirstName}` : targetFirstName;
        const newGroup = await chatService.createGroup({ name, memberIds: [targetUserId] });
        queryClient.invalidateQueries({ queryKey: chatKeys.groups });
        navigate(`/chat/${newGroup.id}`);
      } finally {
        setIsPending(false);
      }
    },
    [queryClient, navigate, user],
  );

  return { start, isPending };
}
