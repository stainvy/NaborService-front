import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '@/services/admin.service';
import { chatService, type CreateGroupPayload } from '@/services/chat.service';
import { adminKeys } from './queryKeys';

export function useAdminGroups() {
  return useQuery({ queryKey: adminKeys.groups, queryFn: () => adminService.listGroups() });
}

export function useCreateAdminGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateGroupPayload) => chatService.createGroup(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminKeys.groups }),
  });
}

export function useGroupMessages(groupId: string | undefined, limit = 50) {
  return useQuery({
    queryKey: adminKeys.groupMessages(groupId ?? ''),
    queryFn: () => adminService.getGroupMessages(groupId!, limit),
    enabled: Boolean(groupId),
  });
}

export function useAdminMessage(id: string | undefined) {
  return useQuery({
    queryKey: adminKeys.message(id ?? ''),
    queryFn: () => adminService.getMessage(id!),
    enabled: Boolean(id),
  });
}

export function useLookupAdminMessage() {
  return useMutation({
    mutationFn: (id: string) => adminService.getMessage(id),
  });
}

export function useDeleteAdminMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminService.deleteMessage(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'chat'] }),
  });
}
