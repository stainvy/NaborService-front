export type CallType = 'audio' | 'video';

// idle : aucun appel. outgoing : on appelle, en attente. incoming : on est
// appelé. active : média connecté (ou en cours de connexion).
export type CallPhase = 'idle' | 'outgoing' | 'incoming' | 'active';

/** Un RTCIceServer (STUN ou TURN). */
export interface IceServer {
  urls: string[];
  username?: string;
  credential?: string;
}

/** Réponse de GET /calls/ice-servers — tableau de RTCIceServer (forme Cloudflare). */
export type IceServers = IceServer[];

export interface CallInitiateResponse {
  id: string;
  group_id: string;
  type: CallType;
  status: string;
  initiated_by: string;
  ice_servers: IceServers;
  created_at: string;
}

/** Identité de l'autre participant, pour l'affichage (nom + avatar). */
export interface CallPeer {
  id: string;
  name: string;
  avatarMongoId?: string | null;
}

export interface IncomingCall {
  callId: string;
  groupId: string;
  type: CallType;
  fromUserId: string;
  iceServers: IceServers;
}
