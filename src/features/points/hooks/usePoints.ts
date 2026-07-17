import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { pointsService } from '@/services/points.service';
import { pointsKeys } from './queryKeys';

export { pointsKeys };

// Solde de points de l'utilisateur connecté. Clé de requête canonique,
// partagée avec le paiement d'annonces (features/listings/hooks/usePayment)
// pour que le crédit/débit invalide bien le même cache.
export function usePointsBalance(enabled = true) {
  return useQuery({
    queryKey: pointsKeys.balance,
    queryFn: () => pointsService.getBalance(),
    enabled,
  });
}

export function usePointsLedger(offset = 0, limit = 20) {
  return useQuery({
    queryKey: pointsKeys.ledger(offset, limit),
    queryFn: () => pointsService.getLedger(offset, limit),
  });
}

// Démarre une recharge : le composant appelant redirige vers `url` au succès.
export function useCreateTopup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (amountCents: number) => pointsService.createTopup(amountCents),
    onSuccess: () => {
      // Le crédit réel n'arrive qu'après le webhook Stripe, mais on invalide
      // quand même pour rafraîchir dès que l'utilisateur revient sur la page.
      queryClient.invalidateQueries({ queryKey: pointsKeys.balance });
    },
  });
}

// Éligibilité au retrait (onboarding Stripe Connect terminé ou non).
export function useConnectStatus() {
  return useQuery({
    queryKey: pointsKeys.connectStatus,
    queryFn: () => pointsService.getConnectStatus(),
  });
}

// Démarre/poursuit l'onboarding Stripe Connect : le composant appelant
// redirige vers `url` au succès.
export function useCreateOnboardingLink() {
  return useMutation({
    mutationFn: () => pointsService.createOnboardingLink(),
  });
}

// Retire des points en virement bancaire réel.
export function useCreateCashout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (amountPoints: number) => pointsService.createCashout(amountPoints),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pointsKeys.balance });
      queryClient.invalidateQueries({ queryKey: ['points', 'ledger'] });
    },
  });
}
