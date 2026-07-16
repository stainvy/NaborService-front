import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/renderWithProviders';
import { mockAuthenticated } from '@/test/fixtures';
import type { ChatMessage } from '@/types/chat';
import { MessageBubble } from './MessageBubble';

const MESSAGE: ChatMessage = {
  id: 'm1',
  sender_id: 'other-1',
  sender: { id: 'other-1', first_name: 'Ana', last_name: 'B', profile_picture_mongo_id: null },
  type: 'text',
  content: 'Bonjour',
  sent_at: '2026-01-01T10:00:00.000Z',
};

function renderBubble(props: Partial<React.ComponentProps<typeof MessageBubble>> = {}) {
  mockAuthenticated();
  return renderWithProviders(
    <MessageBubble
      message={MESSAGE}
      isOwn={false}
      isGroupAdmin={false}
      canParticipate
      onReply={() => {}}
      {...props}
    />,
  );
}

describe('MessageBubble — moderation menu', () => {
  it('shows the pin action for a group actions/admin viewer', async () => {
    renderBubble({ canPin: true });
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'chat.message_actions' }));
    expect(screen.getByRole('button', { name: /chat\.pin/ })).toBeInTheDocument();
  });

  it('hides the pin action for a plain member', async () => {
    renderBubble({ canPin: false });
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'chat.message_actions' }));
    expect(screen.queryByRole('button', { name: /chat\.pin/ })).not.toBeInTheDocument();
  });

  it('offers "unpin" wording once the message is pinned', async () => {
    renderBubble({ canPin: true, message: { ...MESSAGE, pinned: true } });
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'chat.message_actions' }));
    expect(screen.getByRole('button', { name: 'chat.unpin' })).toBeInTheDocument();
  });
});
