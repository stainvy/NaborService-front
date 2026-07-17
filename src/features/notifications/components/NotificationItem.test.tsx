import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';
import { renderWithProviders } from '@/test/renderWithProviders';
import { mockAuthenticated } from '@/test/fixtures';
import { env } from '@/lib/env';
import type { AppNotification } from '@/types/notification';
import { NotificationItem } from './NotificationItem';

const MISSED_CALL: AppNotification = {
  id: 'n1',
  type: 'missed_call',
  payload: { callerName: 'Bob Smith', groupId: 'g1', callType: 'audio' },
  read: false,
  createdAt: new Date().toISOString(),
};

describe('NotificationItem', () => {
  it('renders the type-specific message and marks the notification read on click', async () => {
    mockAuthenticated();
    const markRead = vi.fn();
    server.use(
      http.patch(`${env.apiUrl}/notifications/${MISSED_CALL.id}/read`, () => {
        markRead();
        return new HttpResponse(null, { status: 204 });
      }),
    );

    renderWithProviders(<NotificationItem notification={MISSED_CALL} />);

    expect(await screen.findByText('types.missed_call')).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /types\.missed_call/ }));

    await vi.waitFor(() => expect(markRead).toHaveBeenCalledOnce());
  });

  it('does not show the unread dot for an already-read notification', async () => {
    mockAuthenticated();
    renderWithProviders(<NotificationItem notification={{ ...MISSED_CALL, read: true }} />);

    const button = await screen.findByRole('button', { name: /types\.missed_call/ });
    expect(button.querySelector('.bg-orange.rounded-full')).not.toBeInTheDocument();
  });

  it('deletes the notification without navigating when the delete button is clicked', async () => {
    mockAuthenticated();
    const deleteCall = vi.fn();
    server.use(
      http.delete(`${env.apiUrl}/notifications/${MISSED_CALL.id}`, () => {
        deleteCall();
        return new HttpResponse(null, { status: 204 });
      }),
    );

    renderWithProviders(<NotificationItem notification={MISSED_CALL} />);

    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'delete' }));

    await vi.waitFor(() => expect(deleteCall).toHaveBeenCalledOnce());
  });
});
