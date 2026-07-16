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
    queryFn: () => adminService.getGroupMessages(groupId!, { limit }).then((p) => p.messages),
    enabled: Boolean(groupId),
  });
}

export function useGroupPinned(groupId: string | undefined) {
  return useQuery({
    queryKey: adminKeys.groupPinned(groupId ?? ''),
    queryFn: () => adminService.getGroupPinned(groupId!).then((r) => r.messages),
    enabled: Boolean(groupId),
  });
}

export function useGroupAttachments(groupId: string | undefined) {
  return useQuery({
    queryKey: adminKeys.groupAttachments(groupId ?? ''),
    queryFn: () => adminService.getGroupAttachments(groupId!).then((r) => r.attachments),
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

// Après chaque opération de modération sur un message, on rafraîchit toute la
// sous-arborescence 'admin/chat' (fil du groupe + épinglés + message unitaire) :
// un pin/désépingle/suppression/édition change potentiellement plusieurs vues.
function useInvalidateAdminChat() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['admin', 'chat'] });
}

export function useDeleteAdminMessage() {
  const invalidate = useInvalidateAdminChat();
  return useMutation({
    mutationFn: (id: string) => adminService.deleteMessage(id),
    onSuccess: invalidate,
  });
}

export function useEditAdminMessage() {
  const invalidate = useInvalidateAdminChat();
  return useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) => adminService.editMessage(id, content),
    onSuccess: invalidate,
  });
}

export function usePinAdminMessage() {
  const invalidate = useInvalidateAdminChat();
  return useMutation({
    mutationFn: ({ id, pinned }: { id: string; pinned: boolean }) =>
      pinned ? adminService.unpinMessage(id) : adminService.pinMessage(id),
    onSuccess: invalidate,
  });
}
