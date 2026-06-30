declare global {
  interface Window {
    // Injecté au démarrage du conteneur par docker-entrypoint.sh (cf. public/env-config.js).
    __ENV__?: {
      VITE_API_URL?: string;
      VITE_SOCKET_URL?: string;
    };
  }
}

export const env = {
  apiUrl: window.__ENV__?.VITE_API_URL || import.meta.env.VITE_API_URL,
  socketUrl: window.__ENV__?.VITE_SOCKET_URL || import.meta.env.VITE_SOCKET_URL,
} as const;
