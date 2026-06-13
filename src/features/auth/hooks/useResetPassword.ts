import { useMutation } from '@tanstack/react-query';
import { authService } from '@/services/auth.service';
import type { ResetPasswordPayload } from '@/types/auth';

export function useResetPassword() {
  return useMutation({
    mutationFn: (payload: ResetPasswordPayload) => authService.resetPassword(payload),
  });
}
