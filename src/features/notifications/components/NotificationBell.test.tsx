import { describe, it, expect, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';
import { renderWithProviders } from '@/test/renderWithProviders';
import { mockAuthenticated } from '@/test/fixtures';
import { env } from '@/lib/env';
import { NotificationBell } from './NotificationBell';

const GROUPS = [
  {
    id: 'g1',
    name: 'Quartier Belleville',
    type: 'group_chat',
    member_count: 12,
    unread_count: 2,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  },
];

const NOTIFICATIONS = [
  {
    id: 'n1',
    type: 'new_follower',
    payload: { firstName: 'Bob', followerId: 'u2' },
    read: false,
    createdAt: new Date().toISOString(),
  },
];

function mockNotificationRoutes() {
  server.use(
    http.get(`${env.apiUrl}/chat/groups`, () => HttpResponse.json(GROUPS)),
    http.get(`${env.apiUrl}/notifications`, () =>
      HttpResponse.json({ notifications: NOTIFICATIONS, unreadCount: 1 }),
    ),
    http.get(`${env.apiUrl}/notifications/unread-count`, () =>
      HttpResponse.json({ unreadCount: 1 }),
    ),
    http.patch(
      `${env.apiUrl}/notifications/read-all`,
      () => new HttpResponse(null, { status: 204 }),
    ),
  );
}

describe('NotificationBell', () => {
  it('shows the combined unread badge and opens the panel with both sections', async () => {
    mockAuthenticated();
    mockNotificationRoutes();

    renderWithProviders(<NotificationBell />);

    // 2 unread chat messages + 1 unread notification.
    expect(await screen.findByText('3')).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'title' }));

    expect(await screen.findByText('Quartier Belleville')).toBeInTheDocument();
    expect(screen.getByText('types.new_follower')).toBeInTheDocument();
  });

  it('clears the notification badge after marking all as read', async () => {
    mockAuthenticated();
    mockNotificationRoutes();

    renderWithProviders(<NotificationBell />);
    expect(await screen.findByText('3')).toBeInTheDocument();

    const user = userEvent.setup();
    const bellButton = screen.getByRole('button', { name: 'title' });
    await user.click(bellButton);
    await user.click(await screen.findByText('mark_all_read'));

    // Le badge combiné retombe à 2 (messages non lus, non concernés par "tout marquer lu" des notifications génériques).
    // Ciblé sur le bouton cloche : "2" apparaît aussi sur le badge non-lus du groupe dans le panneau.
    await vi.waitFor(() => expect(within(bellButton).getByText('2')).toBeInTheDocument());
  });
});
