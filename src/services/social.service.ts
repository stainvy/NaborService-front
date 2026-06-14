import { api } from '@/lib/api';
import type { Paginated, PageParams } from '@/types/pagination';
import type {
  DiscoverUser,
  MessageResponse,
  PublicProfile,
  ReportUserPayload,
  SocialUserSummary,
  SwipeDirection,
  SwipeRecord,
} from '@/features/social/types';

// Service du domaine « social » (réseau : profils publics, follow, blocage,
// signalement, découverte, swipe).
export const socialService = {
  getPublicProfile(userId: string): Promise<PublicProfile> {
    return api.get<PublicProfile>(`/users/${userId}`).then((r) => r.data);
  },

  follow(userId: string): Promise<MessageResponse> {
    return api.post<MessageResponse>(`/users/${userId}/follow`).then((r) => r.data);
  },

  unfollow(userId: string): Promise<void> {
    return api.delete(`/users/${userId}/follow`).then(() => undefined);
  },

  getFollowers(userId: string, params?: PageParams): Promise<Paginated<SocialUserSummary>> {
    return api
      .get<Paginated<SocialUserSummary>>(`/users/${userId}/followers`, { params })
      .then((r) => r.data);
  },

  getFollowing(userId: string, params?: PageParams): Promise<Paginated<SocialUserSummary>> {
    return api
      .get<Paginated<SocialUserSummary>>(`/users/${userId}/following`, { params })
      .then((r) => r.data);
  },

  getFriends(userId: string, params?: PageParams): Promise<Paginated<SocialUserSummary>> {
    return api
      .get<Paginated<SocialUserSummary>>(`/users/${userId}/friends`, { params })
      .then((r) => r.data);
  },

  block(userId: string): Promise<MessageResponse> {
    return api.post<MessageResponse>(`/users/${userId}/block`).then((r) => r.data);
  },

  unblock(userId: string): Promise<void> {
    return api.delete(`/users/${userId}/block`).then(() => undefined);
  },

  getBlocks(params?: PageParams): Promise<Paginated<SocialUserSummary>> {
    return api
      .get<Paginated<SocialUserSummary>>('/users/me/blocks', { params })
      .then((r) => r.data);
  },

  report(userId: string, payload: ReportUserPayload): Promise<MessageResponse> {
    return api.post<MessageResponse>(`/users/${userId}/report`, payload).then((r) => r.data);
  },

  // ⚠️ /users/search est actuellement cassé côté back (q requis par le
  // contrôleur mais rejeté par la ValidationPipe). On respecte le contrat
  // documenté (?q=) ; l'appel échouera tant que le back n'est pas corrigé.
  search(q: string, params?: PageParams): Promise<Paginated<DiscoverUser>> {
    return api
      .get<Paginated<DiscoverUser>>('/users/search', { params: { q, ...params } })
      .then((r) => r.data);
  },

  discover(params?: PageParams): Promise<Paginated<DiscoverUser>> {
    return api.get<Paginated<DiscoverUser>>('/users/discover', { params }).then((r) => r.data);
  },

  swipe(userId: string, direction: SwipeDirection): Promise<MessageResponse> {
    return api.post<MessageResponse>(`/users/${userId}/swipe`, { direction }).then((r) => r.data);
  },

  getSwipes(params?: PageParams): Promise<Paginated<SwipeRecord>> {
    return api.get<Paginated<SwipeRecord>>('/users/me/swipes', { params }).then((r) => r.data);
  },
};
