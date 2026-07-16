import { useMutation, useQueryClient } from '@tanstack/react-query';
import { listingsService } from '@/services/listings.service';
import { listingKeys } from './queryKeys';
import type { CancelListingPayload, Listing } from '../types';

// Après chaque transition de statut, on resynchronise le détail + les listes.
function useTransition(id: string, action: () => Promise<Listing>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: action,
    onSuccess: (updated) => {
      queryClient.setQueryData(listingKeys.detail(id), updated);
      queryClient.invalidateQueries({ queryKey: listingKeys.all });
    },
  });
}

export function useExpressInterest(id: string) {
  return useTransition(id, () => listingsService.expressInterest(id));
}

export function useAcceptInterest(id: string) {
  return useTransition(id, () => listingsService.accept(id));
}

export function useConfirmExecution(id: string) {
  return useTransition(id, () => listingsService.confirm(id));
}

export function useCancelListing(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CancelListingPayload) => listingsService.cancel(id, payload),
    onSuccess: (updated) => {
      queryClient.setQueryData(listingKeys.detail(id), updated);
      queryClient.invalidateQueries({ queryKey: listingKeys.all });
    },
  });
}
