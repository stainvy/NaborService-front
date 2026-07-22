import type { Role } from '@/types/roles';
import type { Visibility } from '@/features/profile/types';

// GET /users/:id — la réponse dépend de la visibilité (confirmé en direct) :
// - restreint (private / friends sans amitié) : { id, firstName, lastName, visibility }
// - complet  (public / ami)                   : + bio, neighbourhoodId,
//   profilePictureMongoId, bannerMongoId, role, createdAt
export interface PublicProfile {
  id: string;
  firstName: string;
  lastName: string;
  visibility: Visibility;
  bio?: string | null;
  neighbourhoodId?: string | null;
  profilePictureMongoId?: string | null;
  bannerMongoId?: string | null;
  role?: Role;
  createdAt?: string;
  /** Relation du visiteur connecté envers cet utilisateur. */
  isFollowing?: boolean;
  /** Follow mutuel — seul cas où un groupe direct_message existe déjà côté back. */
  isFriend?: boolean;
  isBlockedByMe?: boolean;
}

// Un profil « complet » expose createdAt/role ; sinon il est restreint.
export function isFullProfile(p: PublicProfile): boolean {
  return p.createdAt !== undefined || p.role !== undefined;
}

// GET /users/discover — items avec un score de proximité (confirmé en direct).
export interface DiscoverUser {
  id: string;
  firstName: string;
  lastName: string;
  visibility: Visibility;
  bio: string | null;
  neighbourhoodId: string | null;
  profilePictureMongoId: string | null;
  bannerMongoId: string | null;
  score: number;
}

// ⚠️ Forme des items de followers/following/friends/blocks NON exposée par
// Swagger et listes vides lors du sondage live. Type tolérant et minimal :
// à confirmer/compléter quand des données existeront.
export interface SocialUserSummary {
  id: string;
  firstName: string;
  lastName: string;
  visibility?: Visibility;
  profilePictureMongoId?: string | null;
}

export type SwipeDirection = 'like' | 'dislike';

// GET /users/me/swipes — forme non confirmée (historique vide au sondage).
export interface SwipeRecord {
  id?: string;
  targetUserId?: string;
  direction?: SwipeDirection;
  createdAt?: string;
}

export interface ReportUserPayload {
  reason: string;
}

export interface MessageResponse {
  message: string;
}
