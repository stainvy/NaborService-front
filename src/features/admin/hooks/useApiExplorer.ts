import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eventsService, type CreateEventPayload } from '@/services/events.service';
import { listingsService, type CreateListingPayload } from '@/services/listings.service';
import { usersService } from '@/services/users.service';

const explorerKeys = {
  events: ['admin', 'explorer', 'events'] as const,
  event: (id: string) => ['admin', 'explorer', 'events', id] as const,
  eventContent: (id: string) => ['admin', 'explorer', 'events', id, 'content'] as const,
  listings: ['admin', 'explorer', 'listings'] as const,
  listing: (id: string) => ['admin', 'explorer', 'listings', id] as const,
  listingContent: (id: string) => ['admin', 'explorer', 'listings', id, 'content'] as const,
};

// --- Events ---

export function useExplorerEvents() {
  return useQuery({ queryKey: explorerKeys.events, queryFn: () => eventsService.list() });
}

export function useExplorerEvent(id: string | undefined) {
  return useQuery({
    queryKey: explorerKeys.event(id ?? ''),
    queryFn: () => eventsService.getById(id!),
    enabled: Boolean(id),
  });
}

export function useExplorerEventContent(id: string | undefined) {
  return useQuery({
    queryKey: explorerKeys.eventContent(id ?? ''),
    queryFn: () => eventsService.getContent(id!),
    enabled: Boolean(id),
  });
}

export function useCreateExplorerEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateEventPayload) => eventsService.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: explorerKeys.events }),
  });
}

function useEventAction(fn: (id: string) => Promise<unknown>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fn(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: explorerKeys.events });
      queryClient.invalidateQueries({ queryKey: explorerKeys.event(id) });
    },
  });
}

export function usePublishEvent() {
  return useEventAction((id) => eventsService.publish(id));
}
export function useOpenEvent() {
  return useEventAction((id) => eventsService.open(id));
}
export function useCompleteEvent() {
  return useEventAction((id) => eventsService.complete(id));
}
export function useCancelEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => eventsService.cancel(id, reason),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: explorerKeys.events });
      queryClient.invalidateQueries({ queryKey: explorerKeys.event(id) });
    },
  });
}

export function useUploadEventMedia() {
  return useMutation({
    mutationFn: ({ eventId, file }: { eventId: string; file: File }) =>
      eventsService.uploadMedia(eventId, file),
  });
}

export function useDeleteEventMedia() {
  return useMutation({
    mutationFn: ({ eventId, filename }: { eventId: string; filename: string }) =>
      eventsService.deleteMedia(eventId, filename),
  });
}

// --- Listings ---

export function useExplorerListings() {
  return useQuery({ queryKey: explorerKeys.listings, queryFn: () => listingsService.list() });
}

export function useExplorerListing(id: string | undefined) {
  return useQuery({
    queryKey: explorerKeys.listing(id ?? ''),
    queryFn: () => listingsService.getById(id!),
    enabled: Boolean(id),
  });
}

export function useExplorerListingContent(id: string | undefined) {
  return useQuery({
    queryKey: explorerKeys.listingContent(id ?? ''),
    queryFn: () => listingsService.getContent(id!),
    enabled: Boolean(id),
  });
}

export function useCreateExplorerListing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateListingPayload) => listingsService.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: explorerKeys.listings }),
  });
}

export function useDeleteExplorerListing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => listingsService.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: explorerKeys.listings }),
  });
}

export function useUploadListingMedia() {
  return useMutation({
    mutationFn: ({ listingId, file }: { listingId: string; file: File }) =>
      listingsService.uploadMedia(listingId, file),
  });
}

export function useDeleteListingMedia() {
  return useMutation({
    mutationFn: ({ listingId, mediaId }: { listingId: string; mediaId: string }) =>
      listingsService.deleteMedia(listingId, mediaId),
  });
}

// --- Media (self-profile testing) ---

export function useUploadAvatarExplorer() {
  return useMutation({ mutationFn: (file: File) => usersService.uploadAvatar(file) });
}
export function useDeleteAvatarExplorer() {
  return useMutation({ mutationFn: () => usersService.deleteAvatar() });
}
export function useUploadBannerExplorer() {
  return useMutation({ mutationFn: (file: File) => usersService.uploadBanner(file) });
}
export function useDeleteBannerExplorer() {
  return useMutation({ mutationFn: () => usersService.deleteBanner() });
}
export function useLoadOwnProfile() {
  return useMutation({ mutationFn: () => usersService.getMe() });
}
