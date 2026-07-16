import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getSocket } from '@/lib/socket';
import { listingKeys } from './queryKeys';

// Écoute l'event Socket `listing:status_changed` pour rafraîchir le détail en
// temps réel. Le socket est connecté par AuthProvider après authentification ;
// si absent (non connecté), on ne fait rien (dégradation propre).
export function useListingStatusSocket(id: string | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!id) return;
    const socket = getSocket();
    if (!socket) return;

    const handler = (payload: unknown) => {
      const p = (payload ?? {}) as Record<string, unknown>;
      const changedId = p.listing_id ?? p.listingId ?? p.id;
      if (!changedId || changedId === id) {
        queryClient.invalidateQueries({ queryKey: listingKeys.detail(id) });
        queryClient.invalidateQueries({ queryKey: listingKeys.all });
      }
    };

    socket.on('listing:status_changed', handler);
    return () => {
      socket.off('listing:status_changed', handler);
    };
  }, [id, queryClient]);
}
