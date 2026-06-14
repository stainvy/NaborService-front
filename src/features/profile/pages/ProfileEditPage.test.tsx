import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { Route, Routes } from 'react-router-dom';
import { server } from '@/test/msw/server';
import { renderWithProviders } from '@/test/renderWithProviders';
import { mockAuthenticated, fakeUser } from '@/test/fixtures';
import { env } from '@/lib/env';
import { api } from '@/lib/api';
import { usersService } from '@/services/users.service';
import { ProfileEditPage } from './ProfileEditPage';

function renderEdit() {
  return renderWithProviders(
    <Routes>
      <Route path="/profile/edit" element={<ProfileEditPage />} />
      <Route path="/profile" element={<div>PROFILE</div>} />
    </Routes>,
    { route: '/profile/edit' },
  );
}

describe('ProfileEditPage', () => {
  it('envoie un PATCH /users/me avec les champs modifiés', async () => {
    mockAuthenticated();
    let body: Record<string, unknown> | null = null;
    server.use(
      http.patch(`${env.apiUrl}/users/me`, async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ ...fakeUser, ...body });
      }),
    );

    const user = userEvent.setup();
    renderEdit();

    const firstName = await screen.findByDisplayValue('Jane');
    await user.clear(firstName);
    await user.type(firstName, 'Janet');
    await user.click(screen.getByRole('button', { name: 'profile.save' }));

    await waitFor(() => expect(body).not.toBeNull());
    expect(body).toMatchObject({ firstName: 'Janet', lastName: 'Doe', visibility: 'public' });
  });

  it('construit une FormData avec le champ « file » pour l’upload avatar', async () => {
    // jsdom ne sérialise pas le multipart (boundary) → on vérifie le contrat au
    // niveau du service en espionnant api.post, sans dépendre du réseau.
    const spy = vi
      .spyOn(api, 'post')
      .mockResolvedValue({ data: { profilePictureMongoId: 'pic-1' } });

    const file = new File(['x'], 'avatar.png', { type: 'image/png' });
    const res = await usersService.uploadAvatar(file);

    expect(spy).toHaveBeenCalledWith('/users/me/avatar', expect.any(FormData));
    const sentForm = spy.mock.calls[0][1] as FormData;
    expect((sentForm.get('file') as File).name).toBe('avatar.png');
    expect(res).toEqual({ profilePictureMongoId: 'pic-1' });

    spy.mockRestore();
  });
});
