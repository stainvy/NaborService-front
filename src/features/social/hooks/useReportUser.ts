import { useMutation } from '@tanstack/react-query';
import { socialService } from '@/services/social.service';
import type { ReportUserPayload } from '../types';

export function useReportUser(userId: string) {
  return useMutation({
    mutationFn: (payload: ReportUserPayload) => socialService.report(userId, payload),
  });
}
