import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '@/services/admin.service';
import { adminKeys } from './queryKeys';
import type { AdminUsersQuery } from '@/types/admin';
import type { Role } from '@/types/roles';

export function useAdminUsers(params: AdminUsersQuery) {
  return useQuery({
    queryKey: adminKeys.users(params),
    queryFn: () => adminService.listUsers(params),
  });
}

export function useAdminUser(id: string | undefined) {
  return useQuery({
    queryKey: adminKeys.user(id ?? ''),
    queryFn: () => adminService.getUser(id!),
    enabled: Boolean(id),
  });
}

function useInvalidateUsers() {
  const queryClient = useQueryClient();
  return (id?: string) => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    if (id) queryClient.invalidateQueries({ queryKey: adminKeys.user(id) });
  };
}

export function useUpdateUserRole() {
  const invalidate = useInvalidateUsers();
  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: Role }) => adminService.updateUserRole(id, role),
    onSuccess: (_data, { id }) => invalidate(id),
  });
}

export function useSuspendUser() {
  const invalidate = useInvalidateUsers();
  return useMutation({
    mutationFn: (id: string) => adminService.suspendUser(id),
    onSuccess: (_data, id) => invalidate(id),
  });
}

export function useRestoreUser() {
  const invalidate = useInvalidateUsers();
  return useMutation({
    mutationFn: (id: string) => adminService.restoreUser(id),
    onSuccess: (_data, id) => invalidate(id),
  });
}

export function useResetUserTotp() {
  const invalidate = useInvalidateUsers();
  return useMutation({
    mutationFn: (id: string) => adminService.resetUserTotp(id),
    onSuccess: (_data, id) => invalidate(id),
  });
}

export function useDeleteUser() {
  const invalidate = useInvalidateUsers();
  return useMutation({
    mutationFn: (id: string) => adminService.deleteUser(id),
    onSuccess: () => invalidate(),
  });
}
