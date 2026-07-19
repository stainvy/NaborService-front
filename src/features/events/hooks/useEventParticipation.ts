import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { eventsService } from '@/services/events.service';
import { downloadBlob } from '@/lib/download';
import { eventKeys } from './queryKeys';
import type { EventSwipeDirection, ReportEventPayload } from '../types';

// Inscription : le back répond 202 ; le vrai résultat arrive via Socket
// (cf. useEventSocket). On invalide juste après pour rafraîchir.
export function useRegisterEvent(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => eventsService.register(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: eventKeys.participants(id) });
    },
  });
}

export function useUnregisterEvent(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => eventsService.unregister(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: eventKeys.participants(id) });
      queryClient.invalidateQueries({ queryKey: eventKeys.waitlist(id) });
    },
  });
}

// Participants / liste d'attente : réservés au créateur (403 sinon) → enabled
// piloté par l'appelant.
export function useEventParticipants(id: string | undefined, enabled = true) {
  return useQuery({
    queryKey: eventKeys.participants(id ?? ''),
    queryFn: () => eventsService.getParticipants(id!),
    enabled: Boolean(id) && enabled,
    retry: false,
  });
}

export function useEventWaitlist(id: string | undefined, enabled = true) {
  return useQuery({
    queryKey: eventKeys.waitlist(id ?? ''),
    queryFn: () => eventsService.getWaitlist(id!),
    enabled: Boolean(id) && enabled,
    retry: false,
  });
}

export function useSwipeEvent() {
  return useMutation({
    mutationFn: ({ id, direction }: { id: string; direction: EventSwipeDirection }) =>
      eventsService.swipe(id, direction),
  });
}

export function useReportEvent(id: string) {
  return useMutation({
    mutationFn: (payload: ReportEventPayload) => eventsService.report(id, payload),
  });
}

export function useEventChat(id: string | undefined, enabled = true) {
  return useQuery({
    queryKey: eventKeys.chat(id ?? ''),
    queryFn: () => eventsService.getChat(id!),
    enabled: Boolean(id) && enabled,
    retry: false,
  });
}

// Billet PDF : télécharge le blob.
export function useDownloadTicket(id: string) {
  return useMutation({
    mutationFn: () => eventsService.getTicket(id),
    onSuccess: (blob) => downloadBlob(blob, `ticket_${id}.pdf`),
  });
}
