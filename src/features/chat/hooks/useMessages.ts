import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatService } from '@/services/chat.service';
import { chatKeys } from './queryKeys';
import { patchMessageAcrossGroups, findMessageInCache } from './chatCache';
import type { ChatMessage, MessagesPage } from '@/types/chat';

const PAGE_SIZE = 20;

/**
 * `undefined` = page initiale (fil en direct, ou fenêtre `around` posée
 * directement en cache par useJumpToMessage — jamais construite via ce
 * pageParam). `direction` encodée dans le pageParam lui-même plutôt que via
 * le `direction` de contexte de TanStack Query (déprécié en v5).
 */
type MessagesPageParam = { cursor: string; direction: 'older' | 'newer' } | undefined;

// GET /chat/groups/:id/messages?cursor&limit&direction — pages les plus
// récentes en premier au sein d'une page ; direction "older" (bouton
// "charger plus ancien", getNextPageParam) étend la liste de pages vers le
// passé, "newer" (getPreviousPageParam) la complète vers le présent — utile
// uniquement pour combler le trou laissé par un jump-to-message (useJumpToMessage).
export function useMessages(groupId: string | undefined) {
  return useInfiniteQuery({
    queryKey: chatKeys.messages(groupId ?? ''),
    queryFn: ({ pageParam }: { pageParam: MessagesPageParam }) =>
      chatService.getMessages(groupId!, pageParam?.cursor, PAGE_SIZE, undefined, pageParam?.direction ?? 'older'),
    initialPageParam: undefined as MessagesPageParam,
    getNextPageParam: (lastPage): MessagesPageParam =>
      lastPage.cursor ? { cursor: lastPage.cursor, direction: 'older' } : undefined,
    getPreviousPageParam: (firstPage): MessagesPageParam =>
      firstPage.newer_cursor ? { cursor: firstPage.newer_cursor, direction: 'newer' } : undefined,
    enabled: Boolean(groupId),
  });
}

/**
 * Prépare le fil pour afficher un message pas encore chargé (ex. un message
 * épinglé ancien) : si le cache le contient déjà, ne fait rien (l'appelant
 * peut scroller directement) ; sinon remplace le cache par une fenêtre
 * ancrée sur ce message (`?around=`), pour qu'il apparaisse au DOM au
 * prochain rendu. La pagination continue normalement depuis cette fenêtre
 * dans les deux sens : "charger plus ancien" (bouton, existant) vers le
 * passé, et automatiquement vers le présent au fil du scroll (voir
 * ConversationThread — fetchPreviousPage sur hasPreviousPage).
 */
export function useJumpToMessage(groupId: string | undefined) {
  const queryClient = useQueryClient();
  /** Renvoie `true` si une fenêtre de contexte a été chargée (le fil n'est plus "en direct"), `false` si le message était déjà présent. */
  return async (messageId: string): Promise<boolean> => {
    if (!groupId) return false;
    if (findMessageInCache(queryClient, groupId, messageId)) return false;

    const page = await chatService.getMessages(groupId, undefined, PAGE_SIZE, messageId);
    queryClient.setQueryData<{ pages: MessagesPage[]; pageParams: MessagesPageParam[] }>(
      chatKeys.messages(groupId),
      { pages: [page], pageParams: [undefined] },
    );
    return true;
  };
}

/** Revient directement au fil "en direct" après un saut vers un message ancien (ex. un pin), sans repaginer message par message. */
export function useReturnToLiveMessages(groupId: string | undefined) {
  const queryClient = useQueryClient();
  return () => {
    if (!groupId) return;
    queryClient.resetQueries({ queryKey: chatKeys.messages(groupId) });
  };
}

// Suppression REST (chatService.deleteMessage). Le broadcast socket
// `message:deleted` (écouté par useChatSocket) finit par re-confirmer le
// patch pour tous les clients, mais son aller-retour n'est pas assez
// immédiat pour l'auteur de la suppression — d'où une mise à jour optimiste
// ici, annulée via onError si l'appel REST échoue (droits insuffisants,
// réseau…).
export function useDeleteMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (messageId: string) => chatService.deleteMessage(messageId),
    onMutate: (messageId: string) => {
      const previous = patchMessageAcrossGroups(queryClient, messageId, (msg) => ({
        ...msg,
        deleted_at: new Date().toISOString(),
        content: undefined,
      }));
      return { previous };
    },
    onError: (_error, messageId, context) => {
      const previous = context?.previous as ChatMessage | undefined;
      if (previous) patchMessageAcrossGroups(queryClient, messageId, () => previous);
    },
  });
}
