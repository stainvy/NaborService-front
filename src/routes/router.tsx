import { createBrowserRouter } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { RoleRoute } from './RoleRoute';
import { NotFoundPage } from './NotFoundPage';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { RegisterPage } from '@/features/auth/pages/RegisterPage';
import { ForgotPasswordPage } from '@/features/auth/pages/ForgotPasswordPage';
import { ResetPasswordPage } from '@/features/auth/pages/ResetPasswordPage';
import { SessionsPage } from '@/features/auth/pages/SessionsPage';
import { HomePage } from '@/features/home/pages/HomePage';
import { AdminDashboardPage } from '@/features/admin/pages/AdminDashboardPage';
import { ProfilePage } from '@/features/profile/pages/ProfilePage';
import { ProfileEditPage } from '@/features/profile/pages/ProfileEditPage';
import { SecurityPage } from '@/features/profile/pages/SecurityPage';
import { NotificationPreferencesPage } from '@/features/profile/pages/NotificationPreferencesPage';
import { PrivacyPage } from '@/features/profile/pages/PrivacyPage';
import { PublicProfilePage } from '@/features/social/pages/PublicProfilePage';
import { DiscoverPage } from '@/features/social/pages/DiscoverPage';
import { SearchPage } from '@/features/social/pages/SearchPage';
import { SsoValidatePage } from '@/features/sso/pages/SsoValidatePage';

export const router = createBrowserRouter([
  // Routes publiques
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  { path: '/forgot-password', element: <ForgotPasswordPage /> },
  { path: '/reset-password', element: <ResetPasswordPage /> },

  // Zone habitant protégée (session requise)
  {
    element: <ProtectedRoute />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/profile', element: <ProfilePage /> },
      { path: '/profile/edit', element: <ProfileEditPage /> },
      { path: '/security', element: <SecurityPage /> },
      { path: '/settings/notifications', element: <NotificationPreferencesPage /> },
      { path: '/privacy', element: <PrivacyPage /> },
      { path: '/sessions', element: <SessionsPage /> },
      { path: '/discover', element: <DiscoverPage /> },
      { path: '/search', element: <SearchPage /> },
      { path: '/users/:id', element: <PublicProfilePage /> },
      { path: '/auth/sso/qr/validate', element: <SsoValidatePage /> },
    ],
  },

  // Back-office protégé par rôle (≥ moderator)
  {
    path: '/admin',
    element: <RoleRoute minRole="moderator" />,
    children: [{ index: true, element: <AdminDashboardPage /> }],
  },

  { path: '*', element: <NotFoundPage /> },
]);
