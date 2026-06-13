import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';
import { env } from './env';
import { api } from './api';
import { clearAccessToken, setAccessToken } from './tokenStore';

describe('intercepteur axios', () => {
  beforeEach(() => clearAccessToken());

  it('ajoute Authorization: Bearer <token> quand un token est présent', async () => {
    let authHeader: string | null = null;
    server.use(
      http.get(`${env.apiUrl}/ping`, ({ request }) => {
        authHeader = request.headers.get('authorization');
        return HttpResponse.json({ ok: true });
      }),
    );

    setAccessToken('jwt-de-test');
    await api.get('/ping');

    expect(authHeader).toBe('Bearer jwt-de-test');
  });

  it("n'ajoute pas de header Authorization sans token", async () => {
    let authHeader: string | null = 'sentinelle';
    server.use(
      http.get(`${env.apiUrl}/ping`, ({ request }) => {
        authHeader = request.headers.get('authorization');
        return HttpResponse.json({ ok: true });
      }),
    );

    await api.get('/ping');

    expect(authHeader).toBeNull();
  });
});
