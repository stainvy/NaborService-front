// 'weighted' n'est conservé que pour lire les sondages créés avant l'ajout de
// isWeighted (mode de sélection) — un nouveau sondage n'utilise plus que
// 'single'/'multiple', combinables indépendamment avec isWeighted.
export type PollType = 'single' | 'multiple' | 'weighted';
export type PollSelectionType = 'single' | 'multiple';

export interface PollOption {
  id: string;
  pollId?: string;
  label: string;
  /** Poids fixe attribué par le créateur (sondages "weighted"), défaut 1. */
  weight: number;
  createdAt?: string;
}

export interface PollVoter {
  id: string;
  first_name: string | null;
  last_name: string | null;
  profile_picture_mongo_id: string | null;
}

export interface PollResult {
  option_id: string;
  label: string;
  vote_count: number;
  /** Identité des votants pour cette option — présent uniquement si le sondage n'est pas anonyme. */
  voters?: PollVoter[];
}

export interface Poll {
  id: string;
  title: string;
  description: string | null;
  creatorId: string;
  neighbourhoodId: string | null;
  /** Sondage rattaché à une conversation de groupe plutôt qu'à un quartier. */
  groupId: string | null;
  pollType: PollType;
  startsAt: string | null;
  endsAt: string | null;
  isAnonymous: boolean;
  /** Indépendant de pollType : un sondage "multiple" peut aussi être pondéré. */
  isWeighted: boolean;
  closedAt: string | null;
  closedBy: string | null;
  createdAt: string;
  updatedAt: string | null;
  options: PollOption[];
  // Présent uniquement sur GET /polls/:id (pas dans la liste GET /polls).
  results?: PollResult[];
  /** Identité du créateur / de la personne ayant clôturé — GET /polls/:id uniquement. */
  creator?: { id: string; first_name: string | null; last_name: string | null } | null;
  closed_by_user?: { id: string; first_name: string | null; last_name: string | null } | null;
  [key: string]: unknown;
}

export interface PollVote {
  userId: string;
  optionId: string;
  weight: number;
  votedAt: string;
  updatedAt: string | null;
}

export interface MyVoteResponse {
  poll_id: string;
  votes: PollVote[];
}

export interface CreatePollPayload {
  title: string;
  description?: string;
  /** Mode de sélection uniquement — 'weighted' n'est plus accepté à la création, voir is_weighted. */
  poll_type?: PollSelectionType;
  neighbourhood_id?: string;
  /** Sondage rattaché à une conversation de groupe (prioritaire sur neighbourhood_id). */
  group_id?: string;
  starts_at?: string;
  ends_at?: string;
  is_anonymous?: boolean;
  is_weighted?: boolean;
}

export interface UpdatePollPayload {
  title?: string;
  description?: string;
}
