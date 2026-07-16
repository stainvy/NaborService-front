import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';
import { renderWithProviders } from '@/test/renderWithProviders';
import { makeListing } from '@/test/fixtures';
import { env } from '@/lib/env';
import { LifecycleActions } from './LifecycleActions';
import type { Listing, ListingStatus } from '../types';

function mockTransition(name: 'interest' | 'accept' | 'confirm', calls: string[]) {
  server.use(
    http.post(`${env.apiUrl}/listings/L/${name}`, () => {
      calls.push(name);
      return HttpResponse.json(makeListing({ id: 'L' }));
    }),
  );
}

function render(status: ListingStatus, isCreator: boolean) {
  const listing = makeListing({ id: 'L', status }) as unknown as Listing;
  return renderWithProviders(<LifecycleActions listing={listing} isCreator={isCreator} />);
}

describe('LifecycleActions — machine à états', () => {
  it('open + intéressé → POST /interest', async () => {
    const calls: string[] = [];
    mockTransition('interest', calls);
    const user = userEvent.setup();
    render('open', false);
    await user.click(screen.getByRole('button', { name: 'actions.interest' }));
    await waitFor(() => expect(calls).toContain('interest'));
  });

  it('pending + créateur → POST /accept', async () => {
    const calls: string[] = [];
    mockTransition('accept', calls);
    const user = userEvent.setup();
    render('pending', true);
    await user.click(screen.getByRole('button', { name: 'actions.accept' }));
    await waitFor(() => expect(calls).toContain('accept'));
  });

  it('in_progress → POST /confirm', async () => {
    const calls: string[] = [];
    mockTransition('confirm', calls);
    const user = userEvent.setup();
    render('in_progress', false);
    await user.click(screen.getByRole('button', { name: 'actions.confirm' }));
    await waitFor(() => expect(calls).toContain('confirm'));
  });
});
