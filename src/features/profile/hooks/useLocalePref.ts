import { useMutation, useQueryClient } from '@tanstack/react-query';
import { usersService } from '@/services/users.service';
import { profileKeys } from './queryKeys';

// Persiste la langue côté back (PATCH /users/me/locale). Le changement i18n
// côté client reste géré par le LanguageSwitcher.
export function useUpdateLocale() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (locale: string) => usersService.updateLocale(locale),
    onSuccess: (res) => queryClient.setQueryData(profileKeys.locale, res),
  });
}
