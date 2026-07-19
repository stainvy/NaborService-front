import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { eventsService } from '@/services/events.service';
import { eventKeys } from './queryKeys';

export function useEventMediaList(id: string) {
  return useQuery({
    queryKey: eventKeys.media(id),
    queryFn: () => eventsService.getMedia(id),
    enabled: Boolean(id),
  });
}

export function useUploadEventMedia(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => eventsService.uploadMedia(id, file),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: eventKeys.media(id) }),
  });
}

export function useDeleteEventMedia(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (mediaId: string) => eventsService.deleteMedia(id, mediaId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: eventKeys.media(id) }),
  });
}
