import { useContext } from 'react';
import { AuthContext, type AuthContextValue } from './auth-context';

/** Accès à l'état de session et aux actions d'auth. */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth doit être utilisé à l’intérieur de <AuthProvider>.');
  }
  return ctx;
}
