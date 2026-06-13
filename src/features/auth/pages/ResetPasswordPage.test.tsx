import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { renderWithProviders } from '@/test/renderWithProviders';
import { ResetPasswordPage } from './ResetPasswordPage';

function renderReset(route: string) {
  return renderWithProviders(
    <Routes>
      <Route path="/reset-password" element={<ResetPasswordPage />} />
    </Routes>,
    { route },
  );
}

describe('ResetPasswordPage — validation zod', () => {
  it('refuse un mot de passe de moins de 12 caractères (règle reset du back)', async () => {
    const user = userEvent.setup();
    renderReset('/reset-password?token=tok-123');

    // 11 caractères → sous la limite de 12.
    await user.type(await screen.findByLabelText('reset.new_password'), 'shortpass11');
    await user.type(screen.getByLabelText('reset.confirm_password'), 'shortpass11');
    await user.click(screen.getByRole('button', { name: 'reset.submit' }));

    expect(await screen.findByText('validation.password_min')).toBeInTheDocument();
  });

  it('affiche un lien invalide quand le token est absent de l’URL', async () => {
    renderReset('/reset-password');
    expect(await screen.findByText('reset.invalid_link')).toBeInTheDocument();
  });
});
