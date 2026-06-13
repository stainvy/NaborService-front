import { api } from '@/lib/api';
import type { User } from '@/types/user';
import type {
  AccessTokenResponse,
  AuthSession,
  ForgotPasswordPayload,
  LoginChallenge,
  LoginPayload,
  MessageResponse,
  RegisterPayload,
  ResetPasswordPayload,
  TotpPayload,
} from '@/types/auth';

// Service Auth — un endpoint par fonction. Seul endroit qui connaît les URLs.
// Flux : login ne renvoie PAS de token, il renvoie un challenge ; c'est
// totp/verify (ou totp/confirm-setup) qui renvoie l'access_token.
export const authService = {
  register(payload: RegisterPayload): Promise<MessageResponse> {
    return api.post<MessageResponse>('/auth/register', payload).then((r) => r.data);
  },

  login(payload: LoginPayload): Promise<LoginChallenge> {
    return api.post<LoginChallenge>('/auth/login', payload).then((r) => r.data);
  },

  // Cas totp_required : l'utilisateur a déjà configuré le TOTP.
  verifyTotp(payload: TotpPayload): Promise<AccessTokenResponse> {
    return api.post<AccessTokenResponse>('/auth/totp/verify', payload).then((r) => r.data);
  },

  // Cas totp_setup_required : première activation du TOTP.
  confirmTotpSetup(payload: TotpPayload): Promise<AccessTokenResponse> {
    return api.post<AccessTokenResponse>('/auth/totp/confirm-setup', payload).then((r) => r.data);
  },

  refresh(): Promise<AccessTokenResponse> {
    return api.post<AccessTokenResponse>('/auth/refresh', null).then((r) => r.data);
  },

  logout(): Promise<MessageResponse> {
    return api.post<MessageResponse>('/auth/logout').then((r) => r.data);
  },

  logoutAll(): Promise<MessageResponse> {
    return api.post<MessageResponse>('/auth/logout/all').then((r) => r.data);
  },

  getMe(): Promise<User> {
    return api.get<User>('/users/me').then((r) => r.data);
  },

  getSessions(): Promise<AuthSession[]> {
    return api.get<AuthSession[]>('/auth/sessions').then((r) => r.data);
  },

  revokeSession(id: string): Promise<MessageResponse> {
    return api.delete<MessageResponse>(`/auth/sessions/${id}`).then((r) => r.data);
  },

  forgotPassword(payload: ForgotPasswordPayload): Promise<MessageResponse> {
    return api.post<MessageResponse>('/auth/forgot-password', payload).then((r) => r.data);
  },

  resetPassword(payload: ResetPasswordPayload): Promise<MessageResponse> {
    return api.post<MessageResponse>('/auth/reset-password', payload).then((r) => r.data);
  },
};
