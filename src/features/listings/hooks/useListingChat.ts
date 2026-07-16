import { useQuery } from '@tanstack/react-query';
import { listingsService } from '@/services/listings.service';
import { listingKeys } from './queryKeys';

// Récupère le groupe de discussion lié (existe seulement quand une transaction
// est en cours). On ne retente pas sur 404.
export function useListingChat(id: string | undefined, enabled = true) {
  return useQuery({
    queryKey: listingKeys.chat(id ?? ''),
    queryFn: () => listingsService.getChat(id!),
    enabled: Boolean(id) && enabled,
    retry: false,
  });
}
