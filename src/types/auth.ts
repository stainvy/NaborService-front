import type { User } from './user';

export interface RegisterPayload {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginChallenge {
  totp_challenge_id: string;
}

export interface VerifyTotpPayload {
  totp_challenge_id: string;
  code: string;
}

export interface ConfirmTotpSetupPayload {
  code: string;
}

/** Réponse contenant l'access token (totp/verify et refresh). */
export interface AccessTokenResponse {
  access_token: string;
  user?: User;
}
