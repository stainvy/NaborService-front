import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { listingsService } from '@/services/listings.service';
import { pointsService } from '@/services/points.service';
import { listingKeys } from './queryKeys';

export const pointsKeys = { balance: ['points', 'balance'] as const };

// Solde de points de l'utilisateur (pour savoir s'il peut payer l'annonce).
export function usePointsBalance(enabled = true) {
  return useQuery({
    queryKey: pointsKeys.balance,
    queryFn: () => pointsService.getBalance(),
    enabled,
  });
}

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
