import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '@/app/providers/AuthProvider';
import { ProtectedRoute } from './ProtectedRoute';

describe('<ProtectedRoute>', () => {
  it('redirige vers /login quand il n’y a pas de session', async () => {
    render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/secret']}>
          <Routes>
            <Route element={<ProtectedRoute />}>
              <Route path="/secret" element={<div>CONTENU PROTÉGÉ</div>} />
            </Route>
            <Route path="/login" element={<div>PAGE LOGIN</div>} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>,
    );

    // Après l'échec du refresh silencieux, on doit atterrir sur /login.
    expect(await screen.findByText('PAGE LOGIN')).toBeInTheDocument();
    expect(screen.queryByText('CONTENU PROTÉGÉ')).not.toBeInTheDocument();
  });
});
