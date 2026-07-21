import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';
import { renderWithProviders } from '@/test/renderWithProviders';
import { mockAuthenticated, makeListing } from '@/test/fixtures';
import { env } from '@/lib/env';
import { HomePage } from './HomePage';

function mockHome({
  listings = [],
  events = [],
}: { listings?: unknown[]; events?: unknown[] } = {}) {
  server.use(
    http.get(`${env.apiUrl}/neighbourhoods`, () => HttpResponse.json([])),
    http.get(`${env.apiUrl}/points/balance`, () => HttpResponse.json({ pointsBalance: 42 })),
    http.get(`${env.apiUrl}/notifications/unread-count`, () =>
      HttpResponse.json({ unreadCount: 0 }),
    ),
    http.get(`${env.apiUrl}/listings`, () =>
      HttpResponse.json({ data: listings, meta: { total: listings.length, offset: 0, limit: 3 } }),
    ),
    http.get(`${env.apiUrl}/events`, () =>
      HttpResponse.json({ data: events, meta: { total: events.length, offset: 0, limit: 3 } }),
    ),
  );
}

describe('HomePage', () => {
  it('affiche les sections du tableau de bord et les états vides', async () => {
    mockAuthenticated();
    mockHome();

    renderWithProviders(<HomePage />);

    // Les grandes sections sont présentes
    expect(await screen.findByText('home.your_activity')).toBeInTheDocument();
    expect(screen.getByText('home.near_you.title')).toBeInTheDocument();
    expect(screen.getByText('home.upcoming_events.title')).toBeInTheDocument();
    expect(screen.getByText('home.quick_access')).toBeInTheDocument();

    // Listes vides → EmptyState traduit pour chaque flux
    expect(await screen.findByText('home.empty.listings.title')).toBeInTheDocument();
    expect(await screen.findByText('home.empty.events.title')).toBeInTheDocument();
  });

  it('affiche les annonces du quartier quand il y en a', async () => {
    mockAuthenticated();
    mockHome({ listings: [makeListing({ title: 'Tonte de pelouse' })] });

    renderWithProviders(<HomePage />);

    expect(await screen.findByText('Tonte de pelouse')).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.queryByText('home.empty.listings.title')).not.toBeInTheDocument(),
    );
  });
});
