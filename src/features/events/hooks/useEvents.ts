import { useQuery } from '@tanstack/react-query';
import { eventsService } from '@/services/events.service';
import { eventKeys } from './queryKeys';
import type { EventFilters } from '../types';

export function useEvents(filters?: EventFilters) {
  return useQuery({
    queryKey: eventKeys.list(filters),
    queryFn: () => eventsService.list(filters),
  });
}

export function useEvent(id: string | undefined) {
  return useQuery({
    queryKey: eventKeys.detail(id ?? ''),
    queryFn: () => eventsService.getById(id!),
    enabled: Boolean(id),
  });
}

export function useEventContent(id: string | undefined) {
  return useQuery({
    queryKey: eventKeys.content(id ?? ''),
    queryFn: () => eventsService.getContent(id!),
    enabled: Boolean(id),
    retry: false, // le contenu enrichi peut ne pas exister (404)
  });
}
