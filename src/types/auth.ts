// ⚠️ Le back mélange les conventions : camelCase pour les corps de requête et
// les objets profil, mais snake_case pour certains champs de réponse auth
// (access_token, challenge_token). On respecte EXACTEMENT le back, on ne
// normalise rien.

export interface RegisterPayload {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

// Réponse de POST /auth/login : un challenge, jamais un token directement.
export type LoginChallenge =
  | { challenge: 'totp_required'; challenge_token: string }
  | { challenge: 'totp_setup_required'; challenge_token: string; otpauthUrl: string };

export type ChallengeKind = LoginChallenge['challenge'];

// Body commun à /auth/totp/verify et /auth/totp/confirm-setup.
export interface TotpPayload {
  challenge_token: string;
  code: string;
}

export interface AccessTokenResponse {
  access_token: string;
}

export interface MessageResponse {
  message: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  token: string;
  password: string;
}

// GET /auth/sessions — snake_case côté réponse.
export interface AuthSession {
  id: string;
  device_name: string;
  ip_address: string;
  created_at: string;
  last_used_at: string;
  is_current: boolean;
}
