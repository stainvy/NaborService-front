import { useQuery, useMutation } from '@tanstack/react-query';
import { dslService, type DslQueryRequest } from '@/services/dsl.service';
import { adminKeys } from './queryKeys';

export function useDslQuery() {
  return useMutation({
    mutationFn: (payload: DslQueryRequest) => dslService.executeQuery(payload),
  });
}

export function useDslAudit(offset: number, limit: number) {
  return useQuery({
    queryKey: adminKeys.audit(offset, limit),
    queryFn: () => dslService.getAudit(offset, limit),
  });
}
