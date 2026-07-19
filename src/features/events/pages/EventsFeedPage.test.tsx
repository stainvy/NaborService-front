import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { Route, Routes } from 'react-router-dom';
import { server } from '@/test/msw/server';
import { renderWithProviders } from '@/test/renderWithProviders';
import { mockAuthenticated } from '@/test/fixtures';
import { env } from '@/lib/env';
import { EventsFeedPage } from './EventsFeedPage';

const fakeEvent = {
  id: 'ev1',
  creatorId: 'someone',
  title: 'Pique-nique de quartier',
  status: 'open',
  costCents: 0,
  maxParticipants: 30,
  startsAt: '2026-08-01T10:00:00.000Z',
  createdAt: '2026-07-01T00:00:00.000Z',
};

function mockCatalog() {
  server.use(
    http.get(`${env.apiUrl}/categories/events`, () => HttpResponse.json([])),
    http.get(`${env.apiUrl}/neighbourhoods`, () => HttpResponse.json([])),
  );
}

describe('EventsFeedPage', () => {
  it('affiche les événements et propage le filtre statut', async () => {
    mockAuthenticated();
    mockCatalog();
    const seenStatuses: (string | null)[] = [];
    server.use(
      http.get(`${env.apiUrl}/events`, ({ request }) => {
        seenStatuses.push(new URL(request.url).searchParams.get('status'));
        return HttpResponse.json({ data: [fakeEvent], meta: { total: 1, offset: 0, limit: 20 } });
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(
      <Routes>
        <Route path="/events" element={<EventsFeedPage />} />
      </Routes>,
      { route: '/events' },
    );

    expect(await screen.findByText('Pique-nique de quartier')).toBeInTheDocument();
    await waitFor(() => expect(seenStatuses.length).toBeGreaterThan(0));

    await user.selectOptions(await screen.findByLabelText('filters.status'), 'open');
    await waitFor(() => expect(seenStatuses).toContain('open'));
  });
});
