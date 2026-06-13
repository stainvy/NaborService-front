import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import i18n from '@/i18n';
import { env } from './env';
import { getAccessToken, setAccessToken, notifyAuthFailure } from './tokenStore';

export const api = axios.create({
  baseURL: env.apiUrl,
  withCredentials: true,
});

// --- Intercepteur de requête : Authorization + Accept-Language ---------------
api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  // La langue active pilote les messages d'erreur traduits côté back.
  config.headers.set('Accept-Language', i18n.language || 'fr');
  return config;
});

// --- Intercepteur de réponse : refresh sur 401 (une seule fois + file) -------
type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

let isRefreshing = false;
/** Requêtes mises en attente pendant qu'un refresh est en cours. */
let waiters: Array<(token: string | null) => void> = [];

function enqueueWaiter(cb: (token: string | null) => void): void {
  waiters.push(cb);
}

function flushWaiters(token: string | null): void {
  waiters.forEach((cb) => cb(token));
  waiters = [];
}

async function performRefresh(): Promise<string | null> {
  try {
    const res = await axios.post<{ access_token: string }>(`${env.apiUrl}/auth/refresh`, null, {
      withCredentials: true,
    });
    const token = res.data?.access_token ?? null;
    setAccessToken(token);
    return token;
  } catch {
    return null;
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined;

    // Pas une 401 exploitable, ou déjà retentée → on propage.
    if (!original || error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    // Une 401 sur le refresh lui-même = session définitivement perdue.
    if (original.url?.includes('/auth/refresh')) {
      notifyAuthFailure();
      return Promise.reject(error);
    }

    original._retry = true;

    // Si un refresh est déjà en cours, on attend son résultat.
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        enqueueWaiter((token) => {
          if (!token) {
            reject(error);
            return;
          }
          original.headers.set('Authorization', `Bearer ${token}`);
          resolve(api(original));
        });
      });
    }

    isRefreshing = true;
    const token = await performRefresh();
    isRefreshing = false;
    flushWaiters(token);

    if (!token) {
      // Refresh échoué → session perdue : purge + redirection /login.
      notifyAuthFailure();
      return Promise.reject(error);
    }

    original.headers.set('Authorization', `Bearer ${token}`);
    return api(original);
  },
);
