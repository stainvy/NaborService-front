import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';
import { renderWithProviders } from '@/test/renderWithProviders';
import { mockAuthenticated } from '@/test/fixtures';
import { env } from '@/lib/env';
import { CreatePollModal } from './CreatePollModal';

async function fillAndSubmit(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('field_title'), 'Quel jour ?');
  const optionInputs = screen.getAllByPlaceholderText('option_placeholder');
  await user.type(optionInputs[0], 'Samedi');
  await user.type(optionInputs[1], 'Dimanche');
  await user.click(screen.getByRole('button', { name: 'create' }));
}

describe('CreatePollModal', () => {
  it('sends group_id (not neighbourhood_id) when created from a group conversation', async () => {
    mockAuthenticated();
    let body: Record<string, unknown> = {};
    server.use(
      http.post(`${env.apiUrl}/polls`, async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ id: 'p1', title: body.title });
      }),
      http.post(`${env.apiUrl}/polls/p1/options`, () => HttpResponse.json({ id: 'o1' })),
    );

    const user = userEvent.setup();
    renderWithProviders(<CreatePollModal open onClose={() => {}} groupId="g1" neighbourhoodId="nb1" />);
    await fillAndSubmit(user);

    await waitFor(() => expect(body.group_id).toBe('g1'));
    expect(body.neighbourhood_id).toBeUndefined();
  });

  it('sends neighbourhood_id when created outside of a group conversation', async () => {
    mockAuthenticated();
    let body: Record<string, unknown> = {};
    server.use(
      http.post(`${env.apiUrl}/polls`, async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ id: 'p1', title: body.title });
      }),
      http.post(`${env.apiUrl}/polls/p1/options`, () => HttpResponse.json({ id: 'o1' })),
    );

    const user = userEvent.setup();
    renderWithProviders(<CreatePollModal open onClose={() => {}} neighbourhoodId="nb1" />);
    await fillAndSubmit(user);

    await waitFor(() => expect(body.neighbourhood_id).toBe('nb1'));
    expect(body.group_id).toBeUndefined();
  });

  it('allows a multiple-choice poll to also be weighted (independent flags, with per-option weights)', async () => {
    mockAuthenticated();
    let pollBody: Record<string, unknown> = {};
    const optionBodies: Record<string, unknown>[] = [];
    server.use(
      http.post(`${env.apiUrl}/polls`, async ({ request }) => {
        pollBody = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ id: 'p1', title: pollBody.title });
      }),
      http.post(`${env.apiUrl}/polls/p1/options`, async ({ request }) => {
        optionBodies.push((await request.json()) as Record<string, unknown>);
        return HttpResponse.json({ id: `o${optionBodies.length}` });
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<CreatePollModal open onClose={() => {}} neighbourhoodId="nb1" />);

    await user.click(screen.getByLabelText('poll_type_multiple'));
    await user.click(screen.getByText('is_weighted'));

    await user.type(screen.getByLabelText('field_title'), 'Activités du quartier ?');
    const optionInputs = screen.getAllByPlaceholderText('option_placeholder');
    await user.type(optionInputs[0], 'Yoga');
    await user.type(optionInputs[1], 'Théâtre');
    const weightInputs = screen.getAllByLabelText('option_weight_label');
    await user.clear(weightInputs[1]);
    await user.type(weightInputs[1], '2.5');
    await user.click(screen.getByRole('button', { name: 'create' }));

    await waitFor(() => expect(pollBody.poll_type).toBe('multiple'));
    expect(pollBody.is_weighted).toBe(true);
    await waitFor(() => expect(optionBodies).toHaveLength(2));
    expect(optionBodies.find((o) => o.label === 'Théâtre')?.weight).toBe(2.5);
  });
});
