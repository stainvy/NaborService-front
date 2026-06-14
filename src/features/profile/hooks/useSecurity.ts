import { useMutation } from '@tanstack/react-query';
import { usersService } from '@/services/users.service';
import type { ChangeEmailPayload, ChangePasswordPayload } from '../types';

export function useChangePassword() {
  return useMutation({
    mutationFn: (payload: ChangePasswordPayload) => usersService.changePassword(payload),
  });
}

export function useChangeEmail() {
  return useMutation({
    mutationFn: (payload: ChangeEmailPayload) => usersService.changeEmail(payload),
  });
}
