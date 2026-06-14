import { useQuery } from '@tanstack/react-query';
import { socialService } from '@/services/social.service';
import { socialKeys } from './queryKeys';
import type { PageParams } from '@/types/pagination';

export function useFollowers(userId: string | undefined, params?: PageParams) {
  return useQuery({
    queryKey: [...socialKeys.followers(userId ?? ''), params],
    queryFn: () => socialService.getFollowers(userId!, params),
    enabled: Boolean(userId),
  });
}

export function useFollowing(userId: string | undefined, params?: PageParams) {
  return useQuery({
    queryKey: [...socialKeys.following(userId ?? ''), params],
    queryFn: () => socialService.getFollowing(userId!, params),
    enabled: Boolean(userId),
  });
}

export function useFriends(userId: string | undefined, params?: PageParams) {
  return useQuery({
    queryKey: [...socialKeys.friends(userId ?? ''), params],
    queryFn: () => socialService.getFriends(userId!, params),
    enabled: Boolean(userId),
  });
}
