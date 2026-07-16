import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { pollsService } from '@/services/polls.service';
import type { CreatePollPayload, UpdatePollPayload } from '@/types/polls';
import { pollsKeys } from './queryKeys';

export function usePolls(neighbourhoodId?: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: pollsKeys.list(neighbourhoodId),
    queryFn: () => pollsService.list({ neighbourhoodId }),
    enabled: options?.enabled ?? true,
  });
}

export function usePollsByGroup(groupId: string | undefined, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: pollsKeys.listByGroup(groupId ?? ''),
    queryFn: () => pollsService.list({ groupId: groupId! }),
    enabled: Boolean(groupId) && (options?.enabled ?? true),
  });
}

export function usePoll(pollId: string | undefined) {
  return useQuery({
    queryKey: pollsKeys.detail(pollId ?? ''),
    queryFn: () => pollsService.getPoll(pollId!),
    enabled: Boolean(pollId),
  });
}

export function useMyVote(pollId: string | undefined) {
  return useQuery({
    queryKey: pollsKeys.myVote(pollId ?? ''),
    queryFn: () => pollsService.getMyVote(pollId!),
    enabled: Boolean(pollId),
  });
}

export function useCreatePoll() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePollPayload) => pollsService.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['polls', 'list'] }),
  });
}

export function useUpdatePoll(pollId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdatePollPayload) => pollsService.update(pollId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pollsKeys.detail(pollId) });
      queryClient.invalidateQueries({ queryKey: ['polls', 'list'] });
    },
  });
}

export function useDeletePoll() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (pollId: string) => pollsService.delete(pollId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['polls', 'list'] }),
  });
}

export function useClosePoll(pollId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => pollsService.close(pollId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pollsKeys.detail(pollId) });
      queryClient.invalidateQueries({ queryKey: ['polls', 'list'] });
    },
  });
}

export function useAddOption(pollId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ label, weight }: { label: string; weight?: number }) =>
      pollsService.addOption(pollId, label, weight),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: pollsKeys.detail(pollId) }),
  });
}

export function useDeleteOption(pollId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (optionId: string) => pollsService.deleteOption(pollId, optionId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: pollsKeys.detail(pollId) }),
  });
}

// ── Vote ─────────────────────────────────────────────────

function invalidateAfterVote(queryClient: ReturnType<typeof useQueryClient>, pollId: string) {
  queryClient.invalidateQueries({ queryKey: pollsKeys.detail(pollId) });
  queryClient.invalidateQueries({ queryKey: pollsKeys.myVote(pollId) });
  // Les cartes de la section Sondages (liste par groupe/quartier) affichent
  // leurs propres résultats agrégés indépendamment de pollsKeys.detail — sans
  // ça, un vote depuis cette liste ne rafraîchirait pas ses propres barres.
  queryClient.invalidateQueries({ queryKey: ['polls', 'list'] });
}

export function useVote(pollId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (optionId: string) => pollsService.vote(pollId, optionId),
    onSuccess: () => invalidateAfterVote(queryClient, pollId),
  });
}

export function useUpdateVote(pollId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (optionId: string) => pollsService.updateVote(pollId, optionId),
    onSuccess: () => invalidateAfterVote(queryClient, pollId),
  });
}

export function useRemoveVote(pollId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (optionId?: string) => pollsService.removeVote(pollId, optionId),
    onSuccess: () => invalidateAfterVote(queryClient, pollId),
  });
}
