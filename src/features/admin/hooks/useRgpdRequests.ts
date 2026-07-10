import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '@/services/admin.service';
import { adminKeys } from './queryKeys';

// GET /admin/rgpd/requests ne prend aucun paramètre (confirmé /api-json) — liste brute.
export function useRgpdRequests() {
  return useQuery({
    queryKey: adminKeys.rgpdRequests(),
    queryFn: () => adminService.listRgpdRequests(),
  });
}

export function useAnonymizeRgpdRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => adminService.anonymizeRgpdRequest(userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'rgpd'] }),
  });
}
