import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { neighbourhoodsService } from '@/services/neighbourhoods.service';
import { geoKeys } from './queryKeys';
import type { CreateNeighbourhoodPayload, UpdateNeighbourhoodPayload } from '@/types/geo';

export function useNeighbourhoods() {
  return useQuery({ queryKey: geoKeys.neighbourhoods, queryFn: () => neighbourhoodsService.listAll() });
}

export function useAdminNeighbourhoods() {
  return useQuery({ queryKey: geoKeys.neighbourhoodsAdmin, queryFn: () => neighbourhoodsService.adminList() });
}

export function useNeighbourhoodMembers(id: string | undefined) {
  return useQuery({
    queryKey: geoKeys.members(id ?? ''),
    queryFn: () => neighbourhoodsService.getMembers(id!),
    enabled: Boolean(id),
  });
}

export function useAdjacentNeighbourhoods(id: string | undefined) {
  return useQuery({
    queryKey: geoKeys.adjacent(id ?? ''),
    queryFn: () => neighbourhoodsService.getAdjacent(id!),
    enabled: Boolean(id),
  });
}

function useInvalidateNeighbourhoods() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'neighbourhoods'] });
  };
}

export function useCreateNeighbourhood() {
  const invalidate = useInvalidateNeighbourhoods();
  return useMutation({
    mutationFn: (payload: CreateNeighbourhoodPayload) => neighbourhoodsService.create(payload),
    onSuccess: invalidate,
  });
}

export function useUpdateNeighbourhood() {
  const invalidate = useInvalidateNeighbourhoods();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateNeighbourhoodPayload }) =>
      neighbourhoodsService.update(id, payload),
    onSuccess: invalidate,
  });
}

export function useDeleteNeighbourhood() {
  const invalidate = useInvalidateNeighbourhoods();
  return useMutation({
    mutationFn: (id: string) => neighbourhoodsService.delete(id),
    onSuccess: invalidate,
  });
}

export function useOverlapCheck() {
  return useMutation({
    mutationFn: (geometry: GeoJSON.Polygon) => neighbourhoodsService.overlapCheck(geometry),
  });
}

export function useReconcileNeighbourhoods() {
  const invalidate = useInvalidateNeighbourhoods();
  return useMutation({
    mutationFn: () => neighbourhoodsService.reconcile(),
    onSuccess: invalidate,
  });
}
