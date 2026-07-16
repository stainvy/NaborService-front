import { api } from '@/lib/api';
import type {
  Poll,
  PollOption,
  CreatePollPayload,
  UpdatePollPayload,
  MyVoteResponse,
} from '@/types/polls';

export const pollsService = {
  /** Sondages d'un quartier ou d'un groupe (mutuellement exclusifs) — clôturés inclus (lecture seule), supprimés exclus. */
  list(params?: { neighbourhoodId?: string; groupId?: string }): Promise<Poll[]> {
    const query = params?.groupId
      ? { group_id: params.groupId }
      : params?.neighbourhoodId
        ? { neighbourhood_id: params.neighbourhoodId }
        : undefined;
    return api.get<Poll[]>('/polls', { params: query }).then((r) => r.data);
  },

  /** Détail + résultats agrégés. */
  getPoll(pollId: string): Promise<Poll> {
    return api.get<Poll>(`/polls/${pollId}`).then((r) => r.data);
  },

  create(payload: CreatePollPayload): Promise<Poll> {
    return api.post<Poll>('/polls', payload).then((r) => r.data);
  },

  update(pollId: string, payload: UpdatePollPayload): Promise<Poll> {
    return api.patch<Poll>(`/polls/${pollId}`, payload).then((r) => r.data);
  },

  delete(pollId: string): Promise<void> {
    return api.delete(`/polls/${pollId}`).then(() => undefined);
  },

  close(pollId: string): Promise<Poll> {
    return api.post<Poll>(`/polls/${pollId}/close`).then((r) => r.data);
  },

  /** `weight` est réservé aux sondages "weighted" — poids de cette option fixé par le créateur, jamais par le votant. */
  addOption(pollId: string, label: string, weight?: number): Promise<PollOption> {
    return api.post<PollOption>(`/polls/${pollId}/options`, { label, weight }).then((r) => r.data);
  },

  deleteOption(pollId: string, optionId: string): Promise<void> {
    return api.delete(`/polls/${pollId}/options/${optionId}`).then(() => undefined);
  },

  getMyVote(pollId: string): Promise<MyVoteResponse> {
    return api.get<MyVoteResponse>(`/polls/${pollId}/vote`).then((r) => r.data);
  },

  /** Le poids du vote est toujours dérivé de l'option côté back — jamais choisi ici. */
  vote(pollId: string, optionId: string): Promise<unknown> {
    return api.post(`/polls/${pollId}/vote`, { option_id: optionId }).then((r) => r.data);
  },

  updateVote(pollId: string, optionId: string): Promise<unknown> {
    return api.put(`/polls/${pollId}/vote`, { option_id: optionId }).then((r) => r.data);
  },

  /** Retire un vote spécifique, ou tous les votes de l'utilisateur sur ce sondage si `optionId` est omis. */
  removeVote(pollId: string, optionId?: string): Promise<void> {
    return api.delete(`/polls/${pollId}/vote`, { data: optionId ? { option_id: optionId } : undefined }).then(() => undefined);
  },
};
