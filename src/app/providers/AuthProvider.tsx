import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { authService } from '@/services/auth.service';
import {
  clearAccessToken,
  setAccessToken,
  setOnAuthFailure,
  subscribeToken,
} from '@/lib/tokenStore';
import { connectAllSockets, disconnectAllSockets, reconnectAllSockets, getSocket } from '@/lib/socket';
import { getJwtExpiryMs } from '@/lib/jwt';
import type { User } from '@/types/user';
import { AuthContext, type AuthContextValue, type AuthStatus } from '@/hooks/auth-context';

// Rafraîchit l'access token ce délai avant son expiration (celle-ci vaut 15 min
// côté back — voir auth.module.ts). Sans ce timer, seule une requête REST en
// échec (401) déclenche le refresh réactif de l'intercepteur axios : un
// utilisateur qui ne fait que discuter par WebSocket (aucun appel REST) garde
// un token expiré indéfiniment, et les émissions socket échouent silencieusement
// (le serveur répond par un événement "exception", jamais une déconnexion) —
// d'où l'impression qu'il faut recharger la page pour que ça reparte.
const PROACTIVE_REFRESH_BUFFER_MS = 60_000;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');
  const initialized = useRef(false);

  const purge = useCallback(() => {
    clearAccessToken();
    disconnectAllSockets();
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
        disconnectAllSockets();
      } else if (getSocket()) {
        reconnectAllSockets(token);
      } else {
        connectAllSockets(token);
      }
    });
  }, []);

  // Planifie un refresh silencieux juste avant l'expiration du token courant,
  // pour que le socket (relié au token via l'effet ci-dessus) ne reste jamais
  // longtemps avec un token périmé.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;

    const unsubscribe = subscribeToken((token) => {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      if (!token) return;

      const expiryMs = getJwtExpiryMs(token);
      if (expiryMs == null) return;

      const delay = Math.max(expiryMs - Date.now() - PROACTIVE_REFRESH_BUFFER_MS, 5_000);
      timer = setTimeout(() => {
        authService.refresh().then(
          ({ access_token }) => setAccessToken(access_token),
          () => purge(),
        );
      }, delay);
    });

    return () => {
      if (timer) clearTimeout(timer);
      unsubscribe();
    };
  }, [purge]);

  const refreshUser = useCallback(async (): Promise<User> => {
    const me = await authService.getMe();
    setUser(me);
    setStatus('authenticated');
    return me;
  }, []);

  const setSession = useCallback(
    async (accessToken: string): Promise<User> => {
      setAccessToken(accessToken);
      return refreshUser();
    },
    [refreshUser],
  );

  // Refresh silencieux au démarrage (une seule fois, même en StrictMode).
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    (async () => {
      try {
        const { access_token } = await authService.refresh();
        await setSession(access_token);
      } catch {
        purge();
      }
    })();
  }, [purge, setSession]);

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
      setSession,
      refreshUser,
      logout,
    }),
    [user, status, setSession, refreshUser, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
