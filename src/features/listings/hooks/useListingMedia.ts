import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { listingsService } from '@/services/listings.service';
import { listingKeys } from './queryKeys';

export function useListingMediaList(id: string) {
  return useQuery({
    queryKey: listingKeys.media(id),
    queryFn: () => listingsService.getMedia(id),
    enabled: Boolean(id),
  });
}

export function useUploadListingMedia(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => listingsService.uploadMedia(id, file),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: listingKeys.media(id) }),
  });
}

export function useDeleteListingMedia(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (mediaId: string) => listingsService.deleteMedia(id, mediaId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: listingKeys.media(id) }),
  });
}
