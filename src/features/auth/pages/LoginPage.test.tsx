import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { Route, Routes } from 'react-router-dom';
import { server } from '@/test/msw/server';
import { renderWithProviders } from '@/test/renderWithProviders';
import { env } from '@/lib/env';
import { LoginPage } from './LoginPage';

const fakeUser = {
  id: 'u1',
  email: 'jane@example.com',
  firstName: 'Jane',
  lastName: 'Doe',
  role: 'resident',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

// Routes minimales : /login + une cible '/' pour détecter la navigation
// post-authentification.
function renderLogin() {
  return renderWithProviders(
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<div>ACCUEIL</div>} />
    </Routes>,
    { route: '/login' },
  );
}

describe('LoginPage — flux TOTP', () => {
  it('login → totp_required → verify → session établie (redirige vers /)', async () => {
    server.use(
      http.post(`${env.apiUrl}/auth/login`, () =>
        HttpResponse.json({ challenge: 'totp_required', challenge_token: 'chall-1' }),
      ),
      http.post(`${env.apiUrl}/auth/totp/verify`, () =>
        HttpResponse.json({ access_token: 'access-123' }),
      ),
      http.get(`${env.apiUrl}/users/me`, () => HttpResponse.json(fakeUser)),
    );

    const user = userEvent.setup();
    renderLogin();

    await user.type(await screen.findByLabelText('login.email'), 'jane@example.com');
    await user.type(screen.getByLabelText('login.password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'login.submit' }));

    // Étape TOTP affichée.
    const codeInput = await screen.findByLabelText('totp.code_label');
    await user.type(codeInput, '123456');
    await user.click(screen.getByRole('button', { name: 'totp.submit' }));

    expect(await screen.findByText('ACCUEIL')).toBeInTheDocument();
  });

  it('login → totp_setup_required → affiche le QR → confirm-setup → session', async () => {
    server.use(
      http.post(`${env.apiUrl}/auth/login`, () =>
        HttpResponse.json({
          challenge: 'totp_setup_required',
          challenge_token: 'chall-2',
          otpauthUrl: 'otpauth://totp/Nabor:jane?secret=ABC&issuer=Nabor',
        }),
      ),
      http.post(`${env.apiUrl}/auth/totp/confirm-setup`, () =>
        HttpResponse.json({ access_token: 'access-456' }),
      ),
      http.get(`${env.apiUrl}/users/me`, () => HttpResponse.json(fakeUser)),
    );

    const user = userEvent.setup();
    const { container } = renderLogin();

    await user.type(await screen.findByLabelText('login.email'), 'jane@example.com');
    await user.type(screen.getByLabelText('login.password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'login.submit' }));

    // Le QR code (svg) doit s'afficher pour la configuration initiale.
    await screen.findByLabelText('totp.code_label');
    expect(container.querySelector('svg')).toBeInTheDocument();

    await user.type(screen.getByLabelText('totp.code_label'), '654321');
    await user.click(screen.getByRole('button', { name: 'totp.submit' }));

    expect(await screen.findByText('ACCUEIL')).toBeInTheDocument();
  });
});
