import { useMutation, useQueryClient } from '@tanstack/react-query';
import { listingsService } from '@/services/listings.service';
import { listingKeys } from './queryKeys';

export function useUploadListingMedia(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => listingsService.uploadMedia(id, file),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: listingKeys.detail(id) }),
  });
}

export function useDeleteListingMedia(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (mediaId: string) => listingsService.deleteMedia(id, mediaId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: listingKeys.detail(id) }),
  });
}
