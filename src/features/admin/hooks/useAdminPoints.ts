import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '@/services/admin.service';
import { adminKeys } from './queryKeys';
import type { AdminLedgerQuery, AdminAdjustPointsPayload } from '@/types/admin';

export function useAdminPointsLedger(params: AdminLedgerQuery) {
  return useQuery({
    queryKey: adminKeys.pointsLedger(params),
    queryFn: () => adminService.getPointsLedger(params),
  });
}

/** Crédite ou débite manuellement le solde de points d'un utilisateur (Admin). */
export function useAdjustPoints() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AdminAdjustPointsPayload) => adminService.adjustPoints(payload),
    onSuccess: (_data, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'points', 'ledger'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: adminKeys.user(userId) });
    },
  });
}
