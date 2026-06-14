import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { usersService } from '@/services/users.service';
import { profileKeys } from './queryKeys';
import type { ProcessingType, RectifyDataPayload } from '../types';

// Déclenche le téléchargement d'un blob (export RGPD) côté navigateur.
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function useExportData() {
  return useMutation({
    mutationFn: (format: 'json' | 'csv') => usersService.exportData(format),
    onSuccess: (blob, format) => downloadBlob(blob, `mes-donnees.${format}`),
  });
}

export function useRectifyData() {
  return useMutation({
    mutationFn: (payload: RectifyDataPayload) => usersService.rectifyData(payload),
  });
}

export function useOptOuts() {
  return useQuery({ queryKey: profileKeys.optOuts, queryFn: () => usersService.getOptOuts() });
}

export function useOptOut() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (processingType: ProcessingType) => usersService.optOut(processingType),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: profileKeys.optOuts }),
  });
}

export function useCancelOptOut() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (processingType: ProcessingType) => usersService.cancelOptOut(processingType),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: profileKeys.optOuts }),
  });
}

export function useRestrictProcessing() {
  return useMutation({ mutationFn: () => usersService.restrictProcessing() });
}

export function useCancelRestrictProcessing() {
  return useMutation({ mutationFn: () => usersService.cancelRestrictProcessing() });
}
