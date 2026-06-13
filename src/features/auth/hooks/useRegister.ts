import { useMutation } from '@tanstack/react-query';
import { authService } from '@/services/auth.service';
import type { RegisterPayload } from '@/types/auth';

export function useRegister() {
  return useMutation({
    mutationFn: (payload: RegisterPayload) => authService.register(payload),
  });
}
