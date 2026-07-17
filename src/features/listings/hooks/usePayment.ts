import { useMutation, useQueryClient } from '@tanstack/react-query';
import { listingsService } from '@/services/listings.service';
import { listingKeys } from './queryKeys';
// Clé de requête et hook de solde canoniques (features/points) — réexportés
// ici pour ne pas casser les imports existants depuis ce fichier.
import { pointsKeys, usePointsBalance } from '@/features/points/hooks/usePoints';

export { pointsKeys, usePointsBalance };

// Paie l'annonce en points, puis resynchronise le détail + le solde.
export function usePayListing(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => listingsService.pay(id),
    onSuccess: (updated) => {
      queryClient.setQueryData(listingKeys.detail(id), updated);
      queryClient.invalidateQueries({ queryKey: listingKeys.all });
      queryClient.invalidateQueries({ queryKey: pointsKeys.balance });
    },
  });
}
