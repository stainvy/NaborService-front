import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { Route, Routes } from 'react-router-dom';
import { server } from '@/test/msw/server';
import { renderWithProviders } from '@/test/renderWithProviders';
import { mockAuthenticated, makeListing } from '@/test/fixtures';
import { env } from '@/lib/env';
import { ListingDetailPage } from './ListingDetailPage';

describe('ListingDetailPage — signalement', () => {
  it('POST /report avec un motif', async () => {
    mockAuthenticated(); // utilisateur me-1, non créateur de l'annonce
    let body: Record<string, unknown> | null = null;
    server.use(
      http.get(`${env.apiUrl}/listings/L`, () =>
        HttpResponse.json(makeListing({ id: 'L', creatorId: 'someone-else' })),
      ),
      http.get(`${env.apiUrl}/listings/L/content`, () =>
        HttpResponse.json({ message: 'Not Found' }, { status: 404 }),
      ),
      http.post(`${env.apiUrl}/listings/L/report`, async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ message: 'ok' });
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(
      <Routes>
        <Route path="/listings/:listingId" element={<ListingDetailPage />} />
      </Routes>,
      { route: '/listings/L' },
    );

    await user.click(await screen.findByText('report.action'));
    await user.type(await screen.findByLabelText('report.reason'), 'Annonce frauduleuse');
    await user.click(screen.getByRole('button', { name: 'report.submit' }));

    await waitFor(() => expect(body).not.toBeNull());
    expect(body).toEqual({ reason: 'Annonce frauduleuse' });
  });
});
