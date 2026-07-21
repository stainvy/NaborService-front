import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { renderWithProviders } from '@/test/renderWithProviders';
import { mockAuthenticated } from '@/test/fixtures';
import { PublicHome } from '@/routes/PublicHome';

describe('Vitrine publique', () => {
  it('affiche la landing pour un visiteur non connecté', async () => {
    // Pas de session mockée → le refresh silencieux échoue → landing visible.
    renderWithProviders(<PublicHome />);

    expect(await screen.findByText('hero.title')).toBeInTheDocument();
    expect(screen.getByText('hero.cta_primary')).toBeInTheDocument();
    // Sections marketing présentes
    expect(screen.getByText('features.title')).toBeInTheDocument();
    expect(screen.getByText('steps.title')).toBeInTheDocument();
  });

  it('redirige un utilisateur connecté de / vers /app', async () => {
    mockAuthenticated();

    renderWithProviders(
      <Routes>
        <Route path="/" element={<PublicHome />} />
        <Route path="/app" element={<div>TABLEAU DE BORD</div>} />
      </Routes>,
      { route: '/' },
    );

    expect(await screen.findByText('TABLEAU DE BORD')).toBeInTheDocument();
  });
});
