import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';
import { renderWithProviders } from '@/test/renderWithProviders';
import { mockAuthenticated } from '@/test/fixtures';
import { env } from '@/lib/env';
import { ConnectionsTabs } from './ConnectionsTabs';

function paginated(total: number) {
  return { data: [], meta: { total, offset: 0, limit: 20 } };
}

describe('ConnectionsTabs', () => {
  it('shows each tab its own count, not the count of whichever tab is active', async () => {
    mockAuthenticated();
    server.use(
      http.get(`${env.apiUrl}/users/user-1/followers`, () => HttpResponse.json(paginated(12))),
      http.get(`${env.apiUrl}/users/user-1/following`, () => HttpResponse.json(paginated(3))),
      http.get(`${env.apiUrl}/users/user-1/friends`, () => HttpResponse.json(paginated(7))),
    );

    const user = userEvent.setup();
    renderWithProviders(<ConnectionsTabs userId="user-1" />);

    expect(await screen.findByRole('button', { name: /followers \(12\)/i })).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: /following \(3\)/i })).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: /friends \(7\)/i })).toBeInTheDocument();

    // Régression : passer sur un autre onglet ne doit pas changer les
    // compteurs affichés sur les AUTRES onglets.
    await user.click(screen.getByRole('button', { name: /following \(3\)/i }));
    expect(screen.getByRole('button', { name: /followers \(12\)/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /friends \(7\)/i })).toBeInTheDocument();
  });
});
