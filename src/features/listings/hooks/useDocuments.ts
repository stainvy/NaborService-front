import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { listingsService } from '@/services/listings.service';
import { downloadBlob } from '@/lib/download';
import { listingKeys } from './queryKeys';
import type { SignDocumentPayload } from '../types';

export function useDownloadContract(id: string) {
  return useMutation({
    mutationFn: () => listingsService.downloadContract(id),
    onSuccess: (blob) => downloadBlob(blob, `contrat-${id}.pdf`),
  });
}

export function useDownloadReceipt(id: string) {
  return useMutation({
    mutationFn: () => listingsService.downloadReceipt(id),
    onSuccess: (blob) => downloadBlob(blob, `recu-${id}.pdf`),
  });
}

export function useSignDocument(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SignDocumentPayload) => listingsService.sign(id, payload),
    // Documents immuables après signature → on rafraîchit le détail + le statut.
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: listingKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: listingKeys.contractStatus(id) });
    },
  });
}

// 404 tant que le contrat n'a pas été généré (avant acceptation de l'intérêt) —
// on ne retry pas et on laisse `isError` piloter l'affichage côté page.
export function useContractStatus(id: string, enabled: boolean) {
  return useQuery({
    queryKey: listingKeys.contractStatus(id),
    queryFn: () => listingsService.getContractStatus(id),
    enabled,
    retry: false,
  });
}
