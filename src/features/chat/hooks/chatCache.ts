import type { InfiniteData, QueryClient } from '@tanstack/react-query';
import type { ChatMessage, MessagesPage } from '@/types/chat';
import { chatKeys } from './queryKeys';

// Hypothèse (à vérifier contre le back réel) : chaque page est la plus récente
// en premier, et à l'intérieur d'une page les messages sont aussi les plus
// récents en premier (index 0 = dernier message). "Charger plus ancien" ajoute
// des pages suivantes ; un nouveau message live se préfixe à pages[0].

/** Ajoute un message reçu en direct, ou réconcilie un message optimiste en attente. */
export function appendOrReconcileMessage(
  queryClient: QueryClient,
  groupId: string,
  message: ChatMessage,
  myUserId: string | undefined,
): void {
  queryClient.setQueryData<InfiniteData<MessagesPage>>(chatKeys.messages(groupId), (old) => {
    if (!old) return { pages: [{ messages: [message] }], pageParams: [undefined] };

    const firstPage = old.pages[0];

    if (myUserId && message.sender_id === myUserId) {
      const pendingIdx = firstPage.messages.findIndex(
        (m) => m.pending && m.type === message.type && m.content === message.content,
      );
      if (pendingIdx !== -1) {
        const messages = [...firstPage.messages];
        messages[pendingIdx] = message;
        return { ...old, pages: [{ ...firstPage, messages }, ...old.pages.slice(1)] };
      }
    }

    if (firstPage.messages.some((m) => m.id === message.id)) return old;
    return { ...old, pages: [{ ...firstPage, messages: [message, ...firstPage.messages] }, ...old.pages.slice(1)] };
  });
}

/**
 * Applique un correctif à un message par son id, en cherchant dans tous les
 * caches de messages actuellement en mémoire (nécessaire pour message:deleted
 * et message:read_ack, diffusés serveur-wide et non limités à la room).
 * Renvoie le message tel qu'il était avant le correctif (ou `undefined` s'il
 * n'a été trouvé dans aucun cache) — permet à l'appelant de revenir en
 * arrière si une mise à jour optimiste doit être annulée (ex. échec réseau).
 */
export function patchMessageAcrossGroups(
  queryClient: QueryClient,
  messageId: string,
  patch: (message: ChatMessage) => ChatMessage,
): ChatMessage | undefined {
  const entries = queryClient.getQueriesData<InfiniteData<MessagesPage>>({ queryKey: ['chat', 'groups'] });
  for (const [key, data] of entries) {
    if (!data || key[key.length - 1] !== 'messages') continue;
    let previous: ChatMessage | undefined;
    const pages = data.pages.map((page) => {
      const idx = page.messages.findIndex((m) => m.id === messageId);
      if (idx === -1) return page;
      previous = page.messages[idx];
      const messages = [...page.messages];
      messages[idx] = patch(messages[idx]);
      return { ...page, messages };
    });
    if (previous) {
      queryClient.setQueryData(key, { ...data, pages });
      return previous;
    }
  }
  return undefined;
}

/** Marque un message optimiste (par id temporaire) comme échoué, si toujours en attente. */
export function markMessageFailed(
  queryClient: QueryClient,
  groupId: string,
  tempId: string,
  failReason?: string,
): void {
  queryClient.setQueryData<InfiniteData<MessagesPage>>(chatKeys.messages(groupId), (old) => {
    if (!old) return old;
    const firstPage = old.pages[0];
    const idx = firstPage.messages.findIndex((m) => m.id === tempId && m.pending);
    if (idx === -1) return old;
    const messages = [...firstPage.messages];
    messages[idx] = { ...messages[idx], pending: false, failed: true, failReason };
    return { ...old, pages: [{ ...firstPage, messages }, ...old.pages.slice(1)] };
  });
}

/** Recherche un message par id dans le cache de messages déjà chargé pour un groupe (sans requête réseau). */
export function findMessageInCache(
  queryClient: QueryClient,
  groupId: string,
  messageId: string,
): ChatMessage | undefined {
  const data = queryClient.getQueryData<InfiniteData<MessagesPage>>(chatKeys.messages(groupId));
  if (!data) return undefined;
  for (const page of data.pages) {
    const found = page.messages.find((m) => m.id === messageId);
    if (found) return found;
  }
  return undefined;
}

/** Préfixe un message optimiste (émis localement, en attente de l'écho serveur). */
export function prependOptimisticMessage(queryClient: QueryClient, groupId: string, message: ChatMessage): void {
  queryClient.setQueryData<InfiniteData<MessagesPage>>(chatKeys.messages(groupId), (old) => {
    if (!old) return { pages: [{ messages: [message] }], pageParams: [undefined] };
    const firstPage = old.pages[0];
    return { ...old, pages: [{ ...firstPage, messages: [message, ...firstPage.messages] }, ...old.pages.slice(1)] };
  });
}
