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

export function useMyEventOperations(filters?: EventFilters) {
  return useQuery({
    queryKey: eventKeys.operations(filters),
    queryFn: () => eventsService.getMyOperations(filters),
  });
}

export function useMyEventRegistrations(filters?: EventFilters) {
  return useQuery({
    queryKey: eventKeys.registrations(filters),
    queryFn: () => eventsService.getMyRegistrations(filters),
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
