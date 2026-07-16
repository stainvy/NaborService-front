import { useQuery } from '@tanstack/react-query';
import { categoriesService } from '@/services/categories.service';
import { neighbourhoodsService } from '@/services/neighbourhoods.service';
import { catalogKeys } from './queryKeys';

// Données quasi statiques : long staleTime.
export function useListingCategories() {
  return useQuery({
    queryKey: catalogKeys.listingCategories,
    queryFn: () => categoriesService.listingCategories(),
    staleTime: 5 * 60_000,
  });
}

export function useNeighbourhoods() {
  return useQuery({
    queryKey: catalogKeys.neighbourhoods,
    queryFn: () => neighbourhoodsService.listAll(),
    staleTime: 5 * 60_000,
  });
}
