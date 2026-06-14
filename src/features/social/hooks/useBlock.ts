import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { socialService } from '@/services/social.service';
import { socialKeys } from './queryKeys';
import type { PageParams } from '@/types/pagination';

export function useBlocks(params?: PageParams) {
  return useQuery({
    queryKey: [...socialKeys.blocks, params],
    queryFn: () => socialService.getBlocks(params),
  });
}

function useBlockMutation(action: (userId: string) => Promise<unknown>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => action(userId),
    onSuccess: (_data, userId) => {
      queryClient.invalidateQueries({ queryKey: socialKeys.blocks });
      queryClient.invalidateQueries({ queryKey: socialKeys.profile(userId) });
    },
  });
}

export function useBlock() {
  return useBlockMutation((userId) => socialService.block(userId));
}

export function useUnblock() {
  return useBlockMutation((userId) => socialService.unblock(userId));
}
