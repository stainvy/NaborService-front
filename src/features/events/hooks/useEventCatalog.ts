import { useQuery } from '@tanstack/react-query';
import { categoriesService } from '@/services/categories.service';
import { eventCatalogKeys } from './queryKeys';

// Catégories d'événements (GET /categories/events). Les quartiers réutilisent
// le hook useNeighbourhoods du module listings (données partagées).
export function useEventCategories() {
  return useQuery({
    queryKey: eventCatalogKeys.categories,
    queryFn: () => categoriesService.eventCategories(),
    staleTime: 5 * 60_000,
  });
}
