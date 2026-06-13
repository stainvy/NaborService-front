import { useMutation } from '@tanstack/react-query';
import { authService } from '@/services/auth.service';
import { useAuth } from '@/hooks/useAuth';
import type { TotpPayload } from '@/types/auth';

// Cas totp_required : vérifie le code, puis établit la session via useAuth.
export function useVerifyTotp() {
  const { setSession } = useAuth();
  return useMutation({
    mutationFn: (payload: TotpPayload) => authService.verifyTotp(payload),
    onSuccess: ({ access_token }) => setSession(access_token),
  });
}
