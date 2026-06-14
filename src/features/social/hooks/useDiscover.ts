import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { socialService } from '@/services/social.service';
import { socialKeys } from './queryKeys';
import type { PageParams } from '@/types/pagination';
import type { SwipeDirection } from '../types';

export function useDiscover(params?: PageParams) {
  return useQuery({
    queryKey: [...socialKeys.discover, params],
    queryFn: () => socialService.discover(params),
  });
}

// Recherche d'utilisateurs (?q=). enabled seulement si q non vide.
export function useSearchUsers(q: string, params?: PageParams) {
  return useQuery({
    queryKey: ['users', 'search', q, params],
    queryFn: () => socialService.search(q, params),
    enabled: q.trim().length > 0,
  });
}

export function useSwipe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, direction }: { userId: string; direction: SwipeDirection }) =>
      socialService.swipe(userId, direction),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: socialKeys.discover });
      queryClient.invalidateQueries({ queryKey: socialKeys.swipes });
    },
  });
}

export function useSwipes(params?: PageParams) {
  return useQuery({
    queryKey: [...socialKeys.swipes, params],
    queryFn: () => socialService.getSwipes(params),
  });
}
