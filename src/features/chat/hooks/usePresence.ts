import { useEffect, useState } from 'react';
import { getSocket } from '@/lib/socket';

interface PresenceQueryResponse {
  users?: { user_id: string; online: boolean }[];
}

// Présence online/offline temps réel (presence.gateway, namespace socket par
// défaut) : interroge l'état initial des utilisateurs affichés
// (`presence:query`, ack) puis suit les broadcasts `presence:online` /
// `presence:offline`. Renvoie une map id → en ligne ; un id jamais vu vaut
// undefined (traité comme hors ligne par les appelants).
export function usePresence(userIds: (string | undefined)[]): Record<string, boolean> {
  const [online, setOnline] = useState<Record<string, boolean>>({});
  // Clé stable : le tableau d'ids est reconstruit à chaque rendu par les
  // appelants — on ne relance l'effet que si son contenu change vraiment.
  const key = [...new Set(userIds.filter((id): id is string => Boolean(id)))].sort().join(',');

  useEffect(() => {
    const ids = key ? key.split(',') : [];
    if (ids.length === 0) return;

    let detach: (() => void) | null = null;

    const attach = (socket: NonNullable<ReturnType<typeof getSocket>>) => {
      socket.emit('presence:query', { user_ids: ids }, (res: PresenceQueryResponse) => {
        if (!res?.users) return;
        setOnline((prev) => {
          const next = { ...prev };
          for (const u of res.users!) next[u.user_id] = u.online;
          return next;
        });
      });

      const onOnline = (p: { user_id: string }) => setOnline((prev) => ({ ...prev, [p.user_id]: true }));
      const onOffline = (p: { user_id: string }) => setOnline((prev) => ({ ...prev, [p.user_id]: false }));
      socket.on('presence:online', onOnline);
      socket.on('presence:offline', onOffline);
      detach = () => {
        socket.off('presence:online', onOnline);
        socket.off('presence:offline', onOffline);
      };
    };

    // Le socket est créé par AuthProvider et peut ne pas encore exister au
    // premier rendu — brève attente jusqu'à sa disponibilité.
    const existing = getSocket();
    let interval: ReturnType<typeof setInterval> | null = null;
    if (existing) attach(existing);
    else {
      interval = setInterval(() => {
        const s = getSocket();
        if (s) {
          if (interval) clearInterval(interval);
          interval = null;
          attach(s);
        }
      }, 400);
    }

    return () => {
      if (interval) clearInterval(interval);
      detach?.();
    };
  }, [key]);

  return online;
}
