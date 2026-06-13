import { createContext } from 'react';
import type { User } from '@/types/user';
import type { Role } from '@/types/roles';
import type { LoginChallenge, LoginPayload, VerifyTotpPayload } from '@/types/auth';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export interface AuthContextValue {
  user: User | null;
  role: Role | null;
  status: AuthStatus;
  isAuthenticated: boolean;
  isLoading: boolean;
  /** Étape 1 : email + mot de passe → déclenche le challenge TOTP. */
  beginLogin: (payload: LoginPayload) => Promise<LoginChallenge>;
  /** Étape 2 : code TOTP → pose l'access token en mémoire et charge l'utilisateur. */
  completeTotp: (payload: VerifyTotpPayload) => Promise<User>;
  /** Révoque la session et purge l'état local. */
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
