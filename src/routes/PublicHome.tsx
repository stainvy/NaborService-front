import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { FullPageLoader } from '@/components/FullPageLoader';
import { LandingPage } from '@/features/landing/pages/LandingPage';

// Racine publique : vitrine pour les visiteurs, redirection vers le tableau
// de bord (/app) si l'utilisateur est déjà connecté.
export function PublicHome() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <FullPageLoader />;
  if (isAuthenticated) return <Navigate to="/app" replace />;
  return <LandingPage />;
}
