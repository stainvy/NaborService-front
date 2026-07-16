import { useMutation, useQueryClient } from '@tanstack/react-query';
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
    // Documents immuables après signature → on rafraîchit le détail.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: listingKeys.detail(id) }),
  });
}
