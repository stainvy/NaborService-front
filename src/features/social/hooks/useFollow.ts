import { useMutation, useQueryClient } from '@tanstack/react-query';
import { socialService } from '@/services/social.service';
import { socialKeys } from './queryKeys';

// Après follow/unfollow, on rafraîchit le profil public ciblé + les listes
// de connexions (followers/following/friends) de cet utilisateur.
function useFollowMutation(action: (userId: string) => Promise<unknown>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => action(userId),
    onSuccess: (_data, userId) => {
      queryClient.invalidateQueries({ queryKey: socialKeys.profile(userId) });
      queryClient.invalidateQueries({ queryKey: socialKeys.followers(userId) });
      queryClient.invalidateQueries({ queryKey: socialKeys.following(userId) });
      queryClient.invalidateQueries({ queryKey: socialKeys.friends(userId) });
    },
  });
}

export function useFollow() {
  return useFollowMutation((userId) => socialService.follow(userId));
}

export function useUnfollow() {
  return useFollowMutation((userId) => socialService.unfollow(userId));
}
