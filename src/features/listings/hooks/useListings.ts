import { useQuery } from '@tanstack/react-query';
import { listingsService } from '@/services/listings.service';
import { listingKeys } from './queryKeys';
import type { ListingFilters } from '../types';

export function useListings(filters?: ListingFilters) {
  return useQuery({
    queryKey: listingKeys.list(filters),
    queryFn: () => listingsService.list(filters),
  });
}

export function useListing(id: string | undefined) {
  return useQuery({
    queryKey: listingKeys.detail(id ?? ''),
    queryFn: () => listingsService.get(id!),
    enabled: Boolean(id),
  });
}

export function useListingContent(id: string | undefined) {
  return useQuery({
    queryKey: listingKeys.content(id ?? ''),
    queryFn: () => listingsService.getContent(id!),
    enabled: Boolean(id),
    // Le contenu enrichi peut ne pas exister (404) : pas de retry inutile.
    retry: false,
  });
}
