import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';
import { renderWithProviders } from '@/test/renderWithProviders';
import { mockAuthenticated } from '@/test/fixtures';
import { env } from '@/lib/env';
import { GroupPollsTab } from './GroupPollsTab';

const POLL = {
  id: 'p1',
  title: 'Quel jour ?',
  description: null,
  creatorId: 'me-1',
  neighbourhoodId: null,
  groupId: 'g1',
  pollType: 'single',
  startsAt: null,
  endsAt: null,
  isAnonymous: false,
  closedAt: null,
  closedBy: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: null,
  options: [
    { id: 'o1', label: 'Samedi', weight: 1 },
    { id: 'o2', label: 'Dimanche', weight: 1 },
  ],
  results: [
    { option_id: 'o1', label: 'Samedi', vote_count: 3 },
    { option_id: 'o2', label: 'Dimanche', vote_count: 1 },
  ],
};

describe('GroupPollsTab', () => {
  it('computes each option\'s vote percentage from the aggregate results', async () => {
    mockAuthenticated();
    server.use(
      http.get(`${env.apiUrl}/polls`, ({ request }) => {
        const url = new URL(request.url);
        expect(url.searchParams.get('group_id')).toBe('g1');
        return HttpResponse.json([POLL]);
      }),
      http.get(`${env.apiUrl}/polls/p1/vote`, () => HttpResponse.json({ poll_id: 'p1', votes: [] })),
    );

    renderWithProviders(<GroupPollsTab groupId="g1" isNeighbourhood={false} canCreate />);

    expect(await screen.findByText('Quel jour ?')).toBeInTheDocument();
    expect(screen.getByText('75%')).toBeInTheDocument();
    expect(screen.getByText('25%')).toBeInTheDocument();
  });

  it('renders nothing but the empty state when the group has no polls', async () => {
    mockAuthenticated();
    server.use(http.get(`${env.apiUrl}/polls`, () => HttpResponse.json([])));

    renderWithProviders(<GroupPollsTab groupId="g1" isNeighbourhood={false} canCreate />);

    expect(await screen.findByText('empty_list')).toBeInTheDocument();
  });
});
