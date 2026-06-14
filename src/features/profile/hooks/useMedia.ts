import { useMutation, useQueryClient } from '@tanstack/react-query';
import { usersService } from '@/services/users.service';
import { useAuth } from '@/hooks/useAuth';
import { profileKeys } from './queryKeys';

// Après changement d'avatar/bannière, on resynchronise le profil (en-tête inclus).
function useMediaMutation<TArgs = void>(mutationFn: (args: TArgs) => Promise<unknown>) {
  const queryClient = useQueryClient();
  const { refreshUser } = useAuth();
  return useMutation({
    mutationFn,
    onSuccess: async () => {
      await refreshUser();
      queryClient.invalidateQueries({ queryKey: profileKeys.me });
    },
  });
}

export function useUploadAvatar() {
  return useMediaMutation<File>((file) => usersService.uploadAvatar(file));
}

export function useDeleteAvatar() {
  return useMediaMutation<void>(() => usersService.deleteAvatar());
}

export function useUploadBanner() {
  return useMediaMutation<File>((file) => usersService.uploadBanner(file));
}

export function useDeleteBanner() {
  return useMediaMutation<void>(() => usersService.deleteBanner());
}
