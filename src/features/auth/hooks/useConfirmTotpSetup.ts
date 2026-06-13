import { useMutation } from '@tanstack/react-query';
import { authService } from '@/services/auth.service';
import { useAuth } from '@/hooks/useAuth';
import type { TotpPayload } from '@/types/auth';

// Cas totp_setup_required : confirme la première activation du TOTP, puis
// établit la session via useAuth.
export function useConfirmTotpSetup() {
  const { setSession } = useAuth();
  return useMutation({
    mutationFn: (payload: TotpPayload) => authService.confirmTotpSetup(payload),
    onSuccess: ({ access_token }) => setSession(access_token),
  });
}
