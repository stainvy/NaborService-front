import { useQuery } from '@tanstack/react-query';
import { categoriesService } from '@/services/categories.service';
import { catalogKeys } from './queryKeys';

// Données quasi statiques : long staleTime.
export function useListingCategories() {
  return useQuery({
    queryKey: catalogKeys.listingCategories,
    queryFn: () => categoriesService.listingCategories(),
    staleTime: 5 * 60_000,
  });
}

// Source unique de la liste des quartiers : le hook transverse partagé
// (même clé de cache ['neighbourhoods']). Voir src/hooks/useNeighbourhoodPicker.
export { useAllNeighbourhoods as useNeighbourhoods } from '@/hooks/useNeighbourhoodPicker';
