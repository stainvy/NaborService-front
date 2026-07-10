import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '@/services/admin.service';
import { adminKeys } from './queryKeys';
import type { AdminConfig } from '@/types/admin';

export function useAdminConfig() {
  return useQuery({ queryKey: adminKeys.config, queryFn: () => adminService.getConfig() });
}

export function useUpdateAdminConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<AdminConfig>) => adminService.updateConfig(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminKeys.config }),
  });
}
