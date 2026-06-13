import { useQuery } from '@tanstack/react-query';
import { authService } from '@/services/auth.service';
import { authKeys } from './queryKeys';

export function useSessions() {
  return useQuery({
    queryKey: authKeys.sessions,
    queryFn: () => authService.getSessions(),
  });
}
