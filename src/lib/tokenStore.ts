let accessToken: string | null = null;

type Listener = (token: string | null) => void;
const listeners = new Set<Listener>();

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
  listeners.forEach((listener) => listener(token));
}

export function clearAccessToken(): void {
  setAccessToken(null);
}

/** S'abonner aux changements de token (utilisé pour reconnecter le socket). */
export function subscribeToken(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

let onAuthFailure: (() => void) | null = null;

export function setOnAuthFailure(handler: (() => void) | null): void {
  onAuthFailure = handler;
}

export function notifyAuthFailure(): void {
  clearAccessToken();
  onAuthFailure?.();
}
