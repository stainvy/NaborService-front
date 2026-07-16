import { useMutation } from '@tanstack/react-query';
import { listingsService } from '@/services/listings.service';
import type { ReportListingPayload } from '../types';

export function useReportListing(id: string) {
  return useMutation({
    mutationFn: (payload: ReportListingPayload) => listingsService.report(id, payload),
  });
}
