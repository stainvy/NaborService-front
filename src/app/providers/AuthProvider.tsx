import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { authService } from '@/services/auth.service';
import {
  clearAccessToken,
  setAccessToken,
  setOnAuthFailure,
  subscribeToken,
} from '@/lib/tokenStore';
import { connectSocket, disconnectSocket, reconnectSocket, getSocket } from '@/lib/socket';
import type { User } from '@/types/user';
import type { LoginPayload, VerifyTotpPayload } from '@/types/auth';
import { AuthContext, type AuthContextValue, type AuthStatus } from '@/hooks/auth-context';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');
  const initialized = useRef(false);

  const purge = useCallback(() => {
    clearAccessToken();
    disconnectSocket();
    setUser(null);
    setStatus('unauthenticated');
  }, []);

  // L'intercepteur axios appelle ceci quand un refresh échoue définitivement.
  useEffect(() => {
    setOnAuthFailure(() => purge());
    return () => setOnAuthFailure(null);
  }, [purge]);

  // Le socket suit le token : (re)connexion à chaque changement.
  useEffect(() => {
    return subscribeToken((token) => {
      if (!token) {
        disconnectSocket();
      } else if (getSocket()) {
        reconnectSocket(token);
      } else {
        connectSocket(token);
      }
    });
  }, []);

  // Refresh silencieux au démarrage (une seule fois, même en StrictMode).
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    (async () => {
      try {
        const { access_token } = await authService.refresh();
        setAccessToken(access_token);
        const me = await authService.getMe();
        setUser(me);
        setStatus('authenticated');
      } catch {
        purge();
      }
    })();
  }, [purge]);

  const beginLogin = useCallback((payload: LoginPayload) => authService.login(payload), []);

  const completeTotp = useCallback(async (payload: VerifyTotpPayload): Promise<User> => {
    const { access_token, user: userFromVerify } = await authService.verifyTotp(payload);
    setAccessToken(access_token);
    const me = userFromVerify ?? (await authService.getMe());
    setUser(me);
    setStatus('authenticated');
    return me;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      purge();
    }
  }, [purge]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      role: user?.role ?? null,
      status,
      isAuthenticated: status === 'authenticated',
      isLoading: status === 'loading',
      beginLogin,
      completeTotp,
      logout,
    }),
    [user, status, beginLogin, completeTotp, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
