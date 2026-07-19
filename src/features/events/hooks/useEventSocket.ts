import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getSocket } from '@/lib/socket';
import { eventKeys } from './queryKeys';

// Résultat d'inscription reçu par Socket pour l'utilisateur courant.
export interface RegistrationOutcome {
  status?: string; // ex. "registered" | "waitlisted"
  promoted?: boolean; // passé de la liste d'attente à inscrit
  failedReason?: string;
}

// Rejoint la room `event:<id>` (protocole `join_event` du gateway back) et
// écoute les événements temps réel. Rafraîchit les queries et remonte le
// résultat d'inscription de l'utilisateur. Dégradation propre si socket absent.
export function useEventSocket(eventId?: string) {
  const queryClient = useQueryClient();
  const [outcome, setOutcome] = useState<RegistrationOutcome | null>(null);

  useEffect(() => {
    if (!eventId) return;
    const socket = getSocket();
    if (!socket) return;

    socket.emit('join_event', { eventId });

    const invalidate = () => {
      queryClient.invalidateQueries({ queryKey: eventKeys.detail(eventId) });
      queryClient.invalidateQueries({ queryKey: eventKeys.participants(eventId) });
      queryClient.invalidateQueries({ queryKey: eventKeys.waitlist(eventId) });
    };
    const matches = (payload: unknown) => {
      const eid = (payload as Record<string, unknown>)?.event_id;
      return !eid || eid === eventId;
    };

    const onResult = (payload: unknown) => {
      if (!matches(payload)) return;
      setOutcome({ status: String((payload as Record<string, unknown>)?.status ?? '') });
      invalidate();
    };
    const onFailed = (payload: unknown) => {
      if (!matches(payload)) return;
      setOutcome({ failedReason: String((payload as Record<string, unknown>)?.reason ?? '') });
    };
    const onPromoted = (payload: unknown) => {
      if (!matches(payload)) return;
      setOutcome({ status: 'registered', promoted: true });
      invalidate();
    };
    const onGeneric = (payload: unknown) => {
      if (matches(payload)) invalidate();
    };

    socket.on('event:registration_result', onResult);
    socket.on('event:registration_failed', onFailed);
    socket.on('event:waitlist_promoted', onPromoted);
    socket.on('event:participant_added', onGeneric);
    socket.on('event:place_available', onGeneric);
    socket.on('event:cancelled', onGeneric);

    return () => {
      socket.off('event:registration_result', onResult);
      socket.off('event:registration_failed', onFailed);
      socket.off('event:waitlist_promoted', onPromoted);
      socket.off('event:participant_added', onGeneric);
      socket.off('event:place_available', onGeneric);
      socket.off('event:cancelled', onGeneric);
    };
  }, [eventId, queryClient]);

  return { outcome, resetOutcome: () => setOutcome(null) };
}
