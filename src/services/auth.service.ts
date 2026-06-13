import { api } from '@/lib/api';
import type { User } from '@/types/user';
import type {
  AccessTokenResponse,
  ConfirmTotpSetupPayload,
  LoginChallenge,
  LoginPayload,
  RegisterPayload,
  VerifyTotpPayload,
} from '@/types/auth';

export const authService = {
  register(payload: RegisterPayload): Promise<void> {
    return api.post('/auth/register', payload).then(() => undefined);
  },

  /** Vérifie email + mot de passe et déclenche le challenge TOTP. */
  login(payload: LoginPayload): Promise<LoginChallenge> {
    return api.post<LoginChallenge>('/auth/login', payload).then((r) => r.data);
  },

  /** Renvoie l'access token (et pose le cookie refresh). */
  verifyTotp(payload: VerifyTotpPayload): Promise<AccessTokenResponse> {
    return api.post<AccessTokenResponse>('/auth/totp/verify', payload).then((r) => r.data);
  },

  /** Première activation du TOTP. */
  confirmTotpSetup(payload: ConfirmTotpSetupPayload): Promise<void> {
    return api.post('/auth/totp/confirm-setup', payload).then(() => undefined);
  },

  /** Rotation : nouveau access token à partir du cookie refresh. */
  refresh(): Promise<AccessTokenResponse> {
    return api.post<AccessTokenResponse>('/auth/refresh', null).then((r) => r.data);
  },

  /** Révoque la session courante. */
  logout(): Promise<void> {
    return api.post('/auth/logout').then(() => undefined);
  },

  /** Utilisateur courant (rôle inclus). */
  getMe(): Promise<User> {
    return api.get<User>('/users/me').then((r) => r.data);
  },
};
