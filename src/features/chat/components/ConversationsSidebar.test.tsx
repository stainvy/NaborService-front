import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';
import { renderWithProviders } from '@/test/renderWithProviders';
import { mockAuthenticated } from '@/test/fixtures';
import { env } from '@/lib/env';
import { ConversationsSidebar } from './ConversationsSidebar';

const GROUPS = [
  {
    id: 'g1',
    name: 'Quartier Belleville',
    type: 'group_chat',
    member_count: 12,
    unread_count: 3,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'g2',
    name: null,
    type: 'direct_message',
    member_count: 2,
    unread_count: 0,
    other_participant: { id: 'u2', first_name: 'Bob', last_name: 'Smith', profile_picture_mongo_id: null },
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  },
];

describe('ConversationsSidebar', () => {
  it('shows the unread badge and filters conversations by tab', async () => {
    mockAuthenticated();
    server.use(http.get(`${env.apiUrl}/chat/groups`, () => HttpResponse.json(GROUPS)));

    renderWithProviders(<ConversationsSidebar />);

    expect(await screen.findByText('Quartier Belleville')).toBeInTheDocument();
    expect(screen.getByText('Bob Smith')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'chat.filter_dm' }));

    expect(screen.queryByText('Quartier Belleville')).not.toBeInTheDocument();
    expect(screen.getByText('Bob Smith')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'chat.filter_groups' }));

    expect(screen.getByText('Quartier Belleville')).toBeInTheDocument();
    expect(screen.queryByText('Bob Smith')).not.toBeInTheDocument();
  });
});
