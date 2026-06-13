import { createContext } from 'react';
import type { User } from '@/types/user';
import type { Role } from '@/types/roles';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export interface AuthContextValue {
  user: User | null;
  role: Role | null;
  status: AuthStatus;
  isAuthenticated: boolean;
  isLoading: boolean;
  // Établit la session à partir d'un access_token (renvoyé par totp/verify
  // ou totp/confirm-setup) : pose le token en mémoire et charge /users/me.
  setSession: (accessToken: string) => Promise<User>;
  // Recharge l'utilisateur courant (après une mutation de profil par ex.).
  refreshUser: () => Promise<User>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
