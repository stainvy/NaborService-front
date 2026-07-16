import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { Route, Routes } from 'react-router-dom';
import { server } from '@/test/msw/server';
import { renderWithProviders } from '@/test/renderWithProviders';
import { mockAuthenticated, mockEmptyCatalog } from '@/test/fixtures';
import { env } from '@/lib/env';
import { ListingsFeedPage } from './ListingsFeedPage';

describe('ListingsFeedPage — filtres', () => {
  it('propage le filtre type dans la query GET /listings', async () => {
    mockAuthenticated();
    mockEmptyCatalog();
    const seenTypes: (string | null)[] = [];
    server.use(
      http.get(`${env.apiUrl}/listings`, ({ request }) => {
        seenTypes.push(new URL(request.url).searchParams.get('type'));
        return HttpResponse.json({ data: [], meta: { total: 0, offset: 0, limit: 20 } });
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(
      <Routes>
        <Route path="/listings" element={<ListingsFeedPage />} />
      </Routes>,
      { route: '/listings' },
    );

    // Premier chargement sans filtre type.
    await waitFor(() => expect(seenTypes.length).toBeGreaterThan(0));

    await user.selectOptions(await screen.findByLabelText('filters.type'), 'offer');

    await waitFor(() => expect(seenTypes).toContain('offer'));
  });
});
