import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { incidentsService } from '@/services/incidents.service';
import { incidentKeys } from './queryKeys';
import type { CreateIncidentPayload, IncidentsQuery, UpdateIncidentPayload } from '@/types/incident';

export function useIncidents(params: IncidentsQuery) {
  return useQuery({
    queryKey: incidentKeys.list(params),
    queryFn: () => incidentsService.list(params),
  });
}

export function useIncident(id: string | undefined) {
  return useQuery({
    queryKey: incidentKeys.detail(id ?? ''),
    queryFn: () => incidentsService.getById(id!),
    enabled: Boolean(id),
  });
}

function useInvalidateIncidents() {
  const queryClient = useQueryClient();
  return (id?: string) => {
    queryClient.invalidateQueries({ queryKey: ['incidents', 'list'] });
    if (id) queryClient.invalidateQueries({ queryKey: incidentKeys.detail(id) });
  };
}

export function useCreateIncident() {
  const invalidate = useInvalidateIncidents();
  return useMutation({
    mutationFn: (payload: CreateIncidentPayload) => incidentsService.create(payload),
    onSuccess: () => invalidate(),
  });
}

export function useUpdateIncident() {
  const invalidate = useInvalidateIncidents();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateIncidentPayload }) =>
      incidentsService.update(id, payload),
    onSuccess: (_data, { id }) => invalidate(id),
  });
}

export function useDeleteIncident() {
  const invalidate = useInvalidateIncidents();
  return useMutation({
    mutationFn: (id: string) => incidentsService.delete(id),
    onSuccess: () => invalidate(),
  });
}

export function useAssignIncident() {
  const invalidate = useInvalidateIncidents();
  return useMutation({
    mutationFn: ({ id, assigneeId }: { id: string; assigneeId?: string }) =>
      incidentsService.assign(id, assigneeId),
    onSuccess: (_data, { id }) => invalidate(id),
  });
}

export function useResolveIncident() {
  const invalidate = useInvalidateIncidents();
  return useMutation({
    mutationFn: (id: string) => incidentsService.resolve(id),
    onSuccess: (_data, id) => invalidate(id),
  });
}

export function useUploadIncidentPhoto() {
  const invalidate = useInvalidateIncidents();
  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) => incidentsService.uploadPhoto(id, file),
    onSuccess: (_data, { id }) => invalidate(id),
  });
}
