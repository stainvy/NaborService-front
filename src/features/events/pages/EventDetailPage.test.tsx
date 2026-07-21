import { describe, it, expect, vi } from 'vitest';
import { act } from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { Route, Routes } from 'react-router-dom';
import { server } from '@/test/msw/server';
import { renderWithProviders } from '@/test/renderWithProviders';
import { mockAuthenticated } from '@/test/fixtures';
import { env } from '@/lib/env';
import { EventDetailPage } from './EventDetailPage';

// Socket contrôlable : on capture les handlers pour émettre les events à la main.
const socketMock = vi.hoisted(() => {
  const handlers = new Map<string, (p: unknown) => void>();
  return {
    handlers,
    socket: {
      emit: () => {},
      on: (ev: string, h: (p: unknown) => void) => handlers.set(ev, h),
      off: (ev: string) => handlers.delete(ev),
    },
  };
});
vi.mock('@/lib/socket', () => ({
  getSocket: () => socketMock.socket,
  connectSocket: () => socketMock.socket,
  reconnectSocket: () => {},
  disconnectSocket: () => {},
  connectAllSockets: () => {},
  reconnectAllSockets: () => {},
  disconnectAllSockets: () => {},
}));

const openEvent = {
  id: 'ev1',
  creatorId: 'someone-else',
  title: 'Concert de quartier',
  status: 'open',
  costCents: 0,
  createdAt: '2026-07-01T00:00:00.000Z',
};

function emit(event: string, payload: unknown) {
  act(() => socketMock.handlers.get(event)?.(payload));
}

function renderDetail() {
  return renderWithProviders(
    <Routes>
      <Route path="/events/:eventId" element={<EventDetailPage />} />
    </Routes>,
    { route: '/events/ev1' },
  );
}

describe('EventDetailPage — inscription asynchrone', () => {
  it('participer → en cours → inscrit (résultat via Socket) + billet', async () => {
    mockAuthenticated();
    server.use(
      http.get(`${env.apiUrl}/events/ev1`, () => HttpResponse.json(openEvent)),
      http.get(`${env.apiUrl}/events/ev1/content`, () => new HttpResponse(null, { status: 404 })),
      http.get(`${env.apiUrl}/events/ev1/chat`, () => HttpResponse.json({ id: 'grp1' })),
      http.post(`${env.apiUrl}/events/ev1/register`, () => new HttpResponse(null, { status: 202 })),
    );

    const user = userEvent.setup();
    renderDetail();

    await user.click(await screen.findByRole('button', { name: 'register.participate' }));
    expect(await screen.findByText('register.pending')).toBeInTheDocument();

    emit('event:registration_result', { event_id: 'ev1', status: 'registered' });

    expect(await screen.findByText('register.registered')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'ticket.download' })).toBeInTheDocument();
  });

  it('participer → liste d’attente (statut waitlisted via Socket)', async () => {
    mockAuthenticated();
    server.use(
      http.get(`${env.apiUrl}/events/ev1`, () => HttpResponse.json(openEvent)),
      http.get(`${env.apiUrl}/events/ev1/content`, () => new HttpResponse(null, { status: 404 })),
      http.post(`${env.apiUrl}/events/ev1/register`, () => new HttpResponse(null, { status: 202 })),
    );

    const user = userEvent.setup();
    renderDetail();

    await user.click(await screen.findByRole('button', { name: 'register.participate' }));
    emit('event:registration_result', { event_id: 'ev1', status: 'waitlisted' });

    expect(await screen.findByText('register.waitlisted')).toBeInTheDocument();
  });
});
