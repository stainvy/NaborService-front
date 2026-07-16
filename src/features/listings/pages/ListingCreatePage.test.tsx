import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { Route, Routes } from 'react-router-dom';
import { server } from '@/test/msw/server';
import { renderWithProviders } from '@/test/renderWithProviders';
import { mockAuthenticated, mockEmptyCatalog } from '@/test/fixtures';
import { env } from '@/lib/env';
import { ListingCreatePage } from './ListingCreatePage';

describe('ListingCreatePage', () => {
  it('POST /listings avec prix euros→centimes et listing_type', async () => {
    mockAuthenticated();
    mockEmptyCatalog();
    let body: Record<string, unknown> | null = null;
    server.use(
      http.post(`${env.apiUrl}/listings`, async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ ...body, id: 'new-1' }, { status: 201 });
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(
      <Routes>
        <Route path="/listings/new" element={<ListingCreatePage />} />
        <Route path="/listings/:listingId/edit" element={<div>EDIT</div>} />
      </Routes>,
      { route: '/listings/new' },
    );

    await user.type(await screen.findByLabelText('form.title'), 'Tonte');
    const price = screen.getByLabelText('form.price_euros');
    await user.clear(price);
    await user.type(price, '15');
    await user.click(screen.getByRole('button', { name: 'create.submit' }));

    await waitFor(() => expect(body).not.toBeNull());
    expect(body).toMatchObject({ title: 'Tonte', listing_type: 'offer', price_cents: 1500 });
    // Redirige vers l'édition après création.
    expect(await screen.findByText('EDIT')).toBeInTheDocument();
  });
});
