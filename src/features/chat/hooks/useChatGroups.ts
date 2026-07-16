import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatService } from '@/services/chat.service';
import { chatKeys } from './queryKeys';
import type { CreateGroupPayload, GroupRole } from '@/types/chat';

export function useChatGroups() {
  return useQuery({ queryKey: chatKeys.groups, queryFn: () => chatService.listGroups() });
}

export function useChatGroup(groupId: string | undefined) {
  return useQuery({
    queryKey: chatKeys.group(groupId ?? ''),
    queryFn: () => chatService.getGroup(groupId!),
    enabled: Boolean(groupId),
  });
}

export function useGroupMembers(groupId: string | undefined) {
  return useQuery({
    queryKey: chatKeys.members(groupId ?? ''),
    queryFn: () => chatService.getMembers(groupId!),
    enabled: Boolean(groupId),
  });
}

export function useCreateGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateGroupPayload) => chatService.createGroup(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: chatKeys.groups }),
  });
}

export function useUpdateGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, payload }: { groupId: string; payload: { name?: string; description?: string } }) =>
      chatService.updateGroup(groupId, payload),
    onSuccess: (_data, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: chatKeys.groups });
      queryClient.invalidateQueries({ queryKey: chatKeys.group(groupId) });
    },
  });
}

export function useDeleteGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (groupId: string) => chatService.deleteGroup(groupId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: chatKeys.groups }),
  });
}

export function useAddMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, memberIds }: { groupId: string; memberIds: string[] }) =>
      chatService.addMember(groupId, memberIds),
    onSuccess: (_data, { groupId }) => queryClient.invalidateQueries({ queryKey: chatKeys.members(groupId) }),
  });
}

export function useRemoveMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, userId }: { groupId: string; userId: string }) =>
      chatService.removeMember(groupId, userId),
    onSuccess: (_data, { groupId }) => queryClient.invalidateQueries({ queryKey: chatKeys.members(groupId) }),
  });
}

export function useUpdateMemberRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, userId, role }: { groupId: string; userId: string; role: GroupRole }) =>
      chatService.updateMemberRole(groupId, userId, role),
    onSuccess: (_data, { groupId }) => queryClient.invalidateQueries({ queryKey: chatKeys.members(groupId) }),
  });
}

export function useMuteGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, durationMinutes }: { groupId: string; durationMinutes?: number }) =>
      chatService.muteGroup(groupId, durationMinutes),
    onSuccess: (_data, { groupId }) => queryClient.invalidateQueries({ queryKey: chatKeys.group(groupId) }),
  });
}

export function useUnmuteGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (groupId: string) => chatService.unmuteGroup(groupId),
    onSuccess: (_data, groupId) => queryClient.invalidateQueries({ queryKey: chatKeys.group(groupId) }),
  });
}
