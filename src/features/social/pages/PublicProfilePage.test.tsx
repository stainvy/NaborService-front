import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { Route, Routes } from 'react-router-dom';
import { server } from '@/test/msw/server';
import { renderWithProviders } from '@/test/renderWithProviders';
import { mockAuthenticated } from '@/test/fixtures';
import { env } from '@/lib/env';
import { PublicProfilePage } from './PublicProfilePage';

function renderProfile(id: string) {
  return renderWithProviders(
    <Routes>
      <Route path="/users/:id" element={<PublicProfilePage />} />
    </Routes>,
    { route: `/users/${id}` },
  );
}

describe('PublicProfilePage', () => {
  it('affiche un profil restreint (visibility private)', async () => {
    mockAuthenticated();
    server.use(
      http.get(`${env.apiUrl}/users/other-1`, () =>
        HttpResponse.json({
          id: 'other-1',
          firstName: 'Bob',
          lastName: 'Smith',
          visibility: 'private',
        }),
      ),
    );

    renderProfile('other-1');

    expect(await screen.findByText('social.restricted')).toBeInTheDocument();
    expect(screen.getByText('Bob Smith')).toBeInTheDocument();
  });

  it('suit un utilisateur (POST /users/:id/follow)', async () => {
    mockAuthenticated();
    let followed = false;
    server.use(
      http.get(`${env.apiUrl}/users/other-2`, () =>
        HttpResponse.json({
          id: 'other-2',
          firstName: 'Ann',
          lastName: 'Lee',
          visibility: 'public',
          bio: 'Hi',
          role: 'resident',
          createdAt: '2026-01-01T00:00:00.000Z',
          neighbourhoodId: null,
          profilePictureMongoId: null,
          bannerMongoId: null,
        }),
      ),
      http.post(`${env.apiUrl}/users/other-2/follow`, () => {
        followed = true;
        return HttpResponse.json({ message: 'ok' });
      }),
    );

    const user = userEvent.setup();
    renderProfile('other-2');

    await user.click(await screen.findByRole('button', { name: 'social.follow' }));
    await waitFor(() => expect(followed).toBe(true));
  });

  it("n'affiche pas le bouton Message quand les utilisateurs ne sont pas amis (follow non mutuel)", async () => {
    mockAuthenticated();
    server.use(
      http.get(`${env.apiUrl}/users/other-3`, () =>
        HttpResponse.json({
          id: 'other-3',
          firstName: 'Sam',
          lastName: 'Doe',
          visibility: 'public',
          bio: 'Hi',
          role: 'resident',
          createdAt: '2026-01-01T00:00:00.000Z',
          neighbourhoodId: null,
          profilePictureMongoId: null,
          bannerMongoId: null,
          isFollowing: true,
          isFriend: false,
        }),
      ),
    );

    renderProfile('other-3');

    await screen.findByText('Sam Doe');
    expect(screen.queryByText('chat.start_direct_message')).not.toBeInTheDocument();
  });

  it('affiche le bouton Message quand les utilisateurs sont amis (follow mutuel)', async () => {
    mockAuthenticated();
    server.use(
      http.get(`${env.apiUrl}/users/other-4`, () =>
        HttpResponse.json({
          id: 'other-4',
          firstName: 'Kim',
          lastName: 'Doe',
          visibility: 'public',
          bio: 'Hi',
          role: 'resident',
          createdAt: '2026-01-01T00:00:00.000Z',
          neighbourhoodId: null,
          profilePictureMongoId: null,
          bannerMongoId: null,
          isFollowing: true,
          isFriend: true,
        }),
      ),
    );

    renderProfile('other-4');

    expect(await screen.findByText('chat.start_direct_message')).toBeInTheDocument();
  });
});
