import { useQuery } from '@tanstack/react-query';
import { adminService } from '@/services/admin.service';
import { adminKeys } from './queryKeys';
import type { AdminLedgerQuery } from '@/types/admin';

export function useAdminPointsLedger(params: AdminLedgerQuery) {
  return useQuery({
    queryKey: adminKeys.pointsLedger(params),
    queryFn: () => adminService.getPointsLedger(params),
  });
}
