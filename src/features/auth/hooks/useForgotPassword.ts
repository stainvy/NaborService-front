import { useMutation } from '@tanstack/react-query';
import { authService } from '@/services/auth.service';
import type { ForgotPasswordPayload } from '@/types/auth';

export function useForgotPassword() {
  return useMutation({
    mutationFn: (payload: ForgotPasswordPayload) => authService.forgotPassword(payload),
  });
}
