import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authService } from '@/services/auth.service';
import { authKeys } from './queryKeys';

export function useRevokeSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => authService.revokeSession(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: authKeys.sessions }),
  });
}
