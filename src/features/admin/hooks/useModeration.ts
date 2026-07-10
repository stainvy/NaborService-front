import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { moderationService } from '@/services/moderation.service';
import { moderationKeys } from './queryKeys';
import type { ModerationActionType, ModerationTargetType } from '@/types/admin';
import type { PageParams } from '@/types/pagination';

export function useReportedListings(params: PageParams) {
  return useQuery({
    queryKey: moderationKeys.reportedListings(params),
    queryFn: () => moderationService.getReportedListings(params),
  });
}

export function useReportedEvents(params: PageParams) {
  return useQuery({
    queryKey: moderationKeys.reportedEvents(params),
    queryFn: () => moderationService.getReportedEvents(params),
  });
}

export function useListingModerationHistory(id: string | undefined) {
  return useQuery({
    queryKey: moderationKeys.listingHistory(id ?? ''),
    queryFn: () => moderationService.getListingModerationHistory(id!),
    enabled: Boolean(id),
  });
}

export function useEventModerationHistory(id: string | undefined) {
  return useQuery({
    queryKey: moderationKeys.eventHistory(id ?? ''),
    queryFn: () => moderationService.getEventModerationHistory(id!),
    enabled: Boolean(id),
  });
}

export function useModerateListing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action, reason }: { id: string; action: ModerationActionType; reason: string }) =>
      moderationService.moderateListing(id, action, reason),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['moderation', 'listings'] });
      queryClient.invalidateQueries({ queryKey: moderationKeys.listingHistory(id) });
    },
  });
}

export function useModerateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action, reason }: { id: string; action: ModerationActionType; reason: string }) =>
      moderationService.moderateEvent(id, action, reason),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['moderation', 'events'] });
      queryClient.invalidateQueries({ queryKey: moderationKeys.eventHistory(id) });
    },
  });
}

export function useModerationHistory(targetType: ModerationTargetType, id: string | undefined) {
  const listing = useListingModerationHistory(targetType === 'listing' ? id : undefined);
  const event = useEventModerationHistory(targetType === 'event' ? id : undefined);
  return targetType === 'listing' ? listing : event;
}
