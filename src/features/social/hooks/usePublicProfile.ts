import { useQuery } from '@tanstack/react-query';
import { socialService } from '@/services/social.service';
import { socialKeys } from './queryKeys';

export function usePublicProfile(userId: string | undefined) {
  return useQuery({
    queryKey: socialKeys.profile(userId ?? ''),
    queryFn: () => socialService.getPublicProfile(userId!),
    enabled: Boolean(userId),
  });
}
