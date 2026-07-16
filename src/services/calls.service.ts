import { api } from '@/lib/api';
import type { CallInitiateResponse, CallType, IceServers } from '@/features/calls/types';

// Signalisation d'appel côté REST. La négociation média (offer/answer/ICE) passe
// ensuite par le namespace socket `/calls` (voir CallProvider). Les serveurs
// STUN/TURN sont fournis par le back (Cloudflare, GET /calls/ice-servers).
export const callsService = {
  /** Démarre un appel audio/vidéo dans une conversation. */
  initiate(groupId: string, type: CallType): Promise<CallInitiateResponse> {
    return api.post<CallInitiateResponse>('/calls', { group_id: groupId, type }).then((r) => r.data);
  },

  /** Serveurs STUN/TURN (credentials courtes, Cloudflare). */
  getIceServers(): Promise<IceServers> {
    return api.get<IceServers>('/calls/ice-servers').then((r) => r.data);
  },

  /** Termine l'appel pour tous les participants (initiateur ou 1:1). */
  end(callId: string): Promise<void> {
    return api.post(`/calls/${callId}/end`).then(() => undefined);
  },
};
