import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { Route, Routes } from 'react-router-dom';
import { server } from '@/test/msw/server';
import { renderWithProviders } from '@/test/renderWithProviders';
import { mockAuthenticated } from '@/test/fixtures';
import { env } from '@/lib/env';
import { SecurityPage } from './SecurityPage';

describe('SecurityPage — changement d’e-mail avec confirmation TOTP', () => {
  it('exige le code TOTP puis envoie newEmail + totpCode', async () => {
    mockAuthenticated();
    let body: Record<string, unknown> | null = null;
    server.use(
      http.patch(`${env.apiUrl}/users/me/email`, async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>;
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(
      <Routes>
        <Route path="/security" element={<SecurityPage />} />
      </Routes>,
      { route: '/security' },
    );

    await user.type(await screen.findByLabelText('security.new_email'), 'new@example.com');
    await user.click(screen.getByRole('button', { name: 'security.email_submit' }));

    // La modale TOTP s'ouvre : on saisit le code à 6 chiffres.
    const code = await screen.findByLabelText('totp.code_label');
    await user.type(code, '123456');
    await user.click(screen.getByRole('button', { name: 'totp.submit' }));

    await waitFor(() => expect(body).not.toBeNull());
    expect(body).toEqual({ newEmail: 'new@example.com', totpCode: '123456' });
  });
});
