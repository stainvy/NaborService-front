import { useMutation, useQueryClient } from '@tanstack/react-query';
import { eventsService } from '@/services/events.service';
import { eventKeys } from './queryKeys';
import type { CreateEventPayload, UpdateEventContentPayload, UpdateEventPayload } from '../types';

export function useCreateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateEventPayload) => eventsService.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: eventKeys.all }),
  });
}

export function useUpdateEvent(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateEventPayload) => eventsService.update(id, payload),
    onSuccess: (updated) => {
      queryClient.setQueryData(eventKeys.detail(id), updated);
      queryClient.invalidateQueries({ queryKey: eventKeys.all });
    },
  });
}

export function useUpdateEventContent(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateEventContentPayload) => eventsService.updateContent(id, payload),
    onSuccess: (content) => queryClient.setQueryData(eventKeys.content(id), content),
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => eventsService.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: eventKeys.all }),
  });
}

export function useUploadEventMedia(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => eventsService.uploadMedia(id, file),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: eventKeys.detail(id) }),
  });
}

export function useDeleteEventMedia(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (filename: string) => eventsService.deleteMedia(id, filename),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: eventKeys.detail(id) }),
  });
}
