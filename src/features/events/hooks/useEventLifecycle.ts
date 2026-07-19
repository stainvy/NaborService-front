import { useMutation, useQueryClient } from '@tanstack/react-query';
import { eventsService } from '@/services/events.service';
import { eventKeys } from './queryKeys';
import type { NaborEvent } from '../types';

// Après une transition de statut, on resynchronise le détail + les listes.
function useTransition(id: string, action: () => Promise<NaborEvent>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: action,
    onSuccess: (updated) => {
      queryClient.setQueryData(eventKeys.detail(id), updated);
      queryClient.invalidateQueries({ queryKey: eventKeys.all });
    },
  });
}

export function usePublishEvent(id: string) {
  return useTransition(id, () => eventsService.publish(id));
}

export function useOpenEvent(id: string) {
  return useTransition(id, () => eventsService.open(id));
}

export function useCompleteEvent(id: string) {
  return useTransition(id, () => eventsService.complete(id));
}

export function useCancelEvent(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reason: string) => eventsService.cancel(id, reason),
    onSuccess: (updated) => {
      queryClient.setQueryData(eventKeys.detail(id), updated);
      queryClient.invalidateQueries({ queryKey: eventKeys.all });
    },
  });
}
