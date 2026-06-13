import { useMutation } from '@tanstack/react-query';
import { authService } from '@/services/auth.service';
import type { LoginPayload } from '@/types/auth';

// Étape 1 du login : renvoie un challenge (totp_required | totp_setup_required).
export function useLogin() {
  return useMutation({
    mutationFn: (payload: LoginPayload) => authService.login(payload),
  });
}
