import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { usersService } from '@/services/users.service';
import { profileKeys } from './queryKeys';
import type { UpdateNotifPrefsPayload } from '../types';

export function useNotifPrefs() {
  return useQuery({
    queryKey: profileKeys.notifPrefs,
    queryFn: () => usersService.getNotifPrefs(),
  });
}

export function useUpdateNotifPrefs() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateNotifPrefsPayload) => usersService.updateNotifPrefs(payload),
    onSuccess: (prefs) => queryClient.setQueryData(profileKeys.notifPrefs, prefs),
  });
}
