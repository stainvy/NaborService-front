import { useQuery } from '@tanstack/react-query';
import { dslService } from '@/services/dsl.service';
import { adminKeys } from './queryKeys';

export function useCollectionQuery(collection: string, query: string, enabled: boolean) {
  return useQuery({
    queryKey: adminKeys.query(collection, query),
    queryFn: () => dslService.executeQuery({ query, collection }),
    enabled,
  });
}
