import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { Route, Routes } from 'react-router-dom';
import { server } from '@/test/msw/server';
import { renderWithProviders } from '@/test/renderWithProviders';
import { mockAuthenticated } from '@/test/fixtures';
import { env } from '@/lib/env';
import { EventCreatePage } from './EventCreatePage';

describe('EventCreatePage', () => {
  it('POST /events avec le coût en points (1 point = 1 cost_cents)', async () => {
    mockAuthenticated();
    server.use(
      http.get(`${env.apiUrl}/categories/events`, () => HttpResponse.json([])),
      http.get(`${env.apiUrl}/neighbourhoods`, () => HttpResponse.json([])),
    );
    let body: Record<string, unknown> | null = null;
    server.use(
      http.post(`${env.apiUrl}/events`, async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ ...body, id: 'new-ev' }, { status: 201 });
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(
      <Routes>
        <Route path="/events/new" element={<EventCreatePage />} />
        <Route path="/events/:eventId" element={<div>DETAIL</div>} />
      </Routes>,
      { route: '/events/new' },
    );

    await user.type(await screen.findByLabelText('form.title'), 'Atelier jardinage');
    const cost = screen.getByLabelText('form.cost_points');
    await user.clear(cost);
    await user.type(cost, '5');
    await user.click(screen.getByRole('button', { name: 'create.submit' }));

    await waitFor(() => expect(body).not.toBeNull());
    expect(body).toMatchObject({ title: 'Atelier jardinage', cost_cents: 5 });
    expect(await screen.findByText('DETAIL')).toBeInTheDocument();
  });
});
