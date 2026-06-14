import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { usersService } from '@/services/users.service';
import { useAuth } from '@/hooks/useAuth';
import { profileKeys } from './queryKeys';
import type { UpdateProfilePayload, DeleteAccountPayload } from '../types';

export function useMe() {
  return useQuery({ queryKey: profileKeys.me, queryFn: () => usersService.getMe() });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { refreshUser } = useAuth();
  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) => usersService.updateProfile(payload),
    onSuccess: async (updated) => {
      queryClient.setQueryData(profileKeys.me, updated);
      // Garde l'en-tête (nom, avatar) à jour via le contexte d'auth.
      await refreshUser();
    },
  });
}

export function useDeleteAccount() {
  const { logout } = useAuth();
  return useMutation({
    mutationFn: (payload: DeleteAccountPayload) => usersService.deleteAccount(payload),
    // Après soft delete : purge l'auth en mémoire (logout gère la redirection).
    onSuccess: () => logout(),
  });
}
