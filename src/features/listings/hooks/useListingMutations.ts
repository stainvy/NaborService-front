import { useMutation, useQueryClient } from '@tanstack/react-query';
import { listingsService } from '@/services/listings.service';
import { listingKeys } from './queryKeys';
import type { CreateListingPayload, UpdateContentPayload, UpdateListingPayload } from '../types';

export function useCreateListing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateListingPayload) => listingsService.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: listingKeys.all }),
  });
}

export function useUpdateListing(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateListingPayload) => listingsService.update(id, payload),
    onSuccess: (updated) => {
      queryClient.setQueryData(listingKeys.detail(id), updated);
      queryClient.invalidateQueries({ queryKey: listingKeys.all });
    },
  });
}

export function useUpdateContent(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateContentPayload) => listingsService.updateContent(id, payload),
    onSuccess: (content) => queryClient.setQueryData(listingKeys.content(id), content),
  });
}

export function useDeleteListing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => listingsService.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: listingKeys.all }),
  });
}
