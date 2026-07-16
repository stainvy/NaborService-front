import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider, type InfiniteData } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';
import { env } from '@/lib/env';
import { useDeleteMessage } from './useMessages';
import { chatKeys } from './queryKeys';
import type { ChatMessage, MessagesPage } from '@/types/chat';

const MESSAGE: ChatMessage = {
  id: 'm1',
  sender_id: 'u1',
  type: 'text',
  content: 'Bonjour',
  sent_at: '2026-01-01T10:00:00.000Z',
};

function makeClientWithSeededMessage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  const data: InfiniteData<MessagesPage> = { pages: [{ messages: [MESSAGE] }], pageParams: [undefined] };
  queryClient.setQueryData(chatKeys.messages('g1'), data);
  return queryClient;
}

function readCachedMessage(queryClient: QueryClient) {
  return queryClient.getQueryData<InfiniteData<MessagesPage>>(chatKeys.messages('g1'))?.pages[0].messages[0];
}

describe('useDeleteMessage', () => {
  it('marks the message deleted in the cache immediately, before the network response arrives', async () => {
    let resolveDelete: () => void = () => {};
    const pending = new Promise<void>((resolve) => { resolveDelete = resolve; });
    server.use(
      http.delete(`${env.apiUrl}/chat/messages/m1`, async () => {
        await pending;
        return HttpResponse.json({ deleted: true });
      }),
    );

    const queryClient = makeClientWithSeededMessage();
    const { result } = renderHook(() => useDeleteMessage(), {
      wrapper: ({ children }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>,
    });

    result.current.mutate('m1');

    // La requête réseau est toujours en attente (pending non résolue) — si le
    // cache est déjà à jour ici, c'est bien une mise à jour optimiste, pas
    // une simple réaction à la réponse serveur.
    await waitFor(() => expect(readCachedMessage(queryClient)?.deleted_at).toBeDefined());
    expect(readCachedMessage(queryClient)?.content).toBeUndefined();

    resolveDelete();
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it('rolls back the optimistic delete when the request fails', async () => {
    server.use(
      http.delete(`${env.apiUrl}/chat/messages/m1`, () => HttpResponse.json({ message: 'forbidden' }, { status: 403 })),
    );

    const queryClient = makeClientWithSeededMessage();
    const { result } = renderHook(() => useDeleteMessage(), {
      wrapper: ({ children }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>,
    });

    result.current.mutate('m1');

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(readCachedMessage(queryClient)?.deleted_at).toBeUndefined();
    expect(readCachedMessage(queryClient)?.content).toBe('Bonjour');
  });
});
