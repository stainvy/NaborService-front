import { http, HttpResponse } from 'msw';
import { env } from '@/lib/env';

export const handlers = [
  http.post(`${env.apiUrl}/auth/refresh`, () => new HttpResponse(null, { status: 401 })),
];
