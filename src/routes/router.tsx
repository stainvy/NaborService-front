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
import { AdminLayout } from '@/features/admin/components/AdminLayout';
import { AdminDashboardPage } from '@/features/admin/pages/AdminDashboardPage';
import { AdminUsersPage } from '@/features/admin/pages/AdminUsersPage';
import { ModerationListingsPage } from '@/features/admin/pages/ModerationListingsPage';
import { ModerationEventsPage } from '@/features/admin/pages/ModerationEventsPage';
import { AdminIncidentsPage } from '@/features/admin/pages/AdminIncidentsPage';
import { GeoPage } from '@/features/admin/pages/GeoPage';
import { MessagesPage } from '@/features/admin/pages/MessagesPage';
import { AdminConfigPage } from '@/features/admin/pages/AdminConfigPage';
import { AdminRgpdPage } from '@/features/admin/pages/AdminRgpdPage';
import { DslConsolePage } from '@/features/admin/pages/DslConsolePage';
import { DslAuditPage } from '@/features/admin/pages/DslAuditPage';
import { DslExplorerPage } from '@/features/admin/pages/DslExplorerPage';
import { ApiExplorerPage } from '@/features/admin/pages/ApiExplorerPage';
import { ProfilePage } from '@/features/profile/pages/ProfilePage';
import { ProfileEditPage } from '@/features/profile/pages/ProfileEditPage';
import { SecurityPage } from '@/features/profile/pages/SecurityPage';
import { NotificationPreferencesPage } from '@/features/profile/pages/NotificationPreferencesPage';
import { PrivacyPage } from '@/features/profile/pages/PrivacyPage';
import { PublicProfilePage } from '@/features/social/pages/PublicProfilePage';
import { DiscoverPage } from '@/features/social/pages/DiscoverPage';
import { SearchPage } from '@/features/social/pages/SearchPage';
import { SsoValidatePage } from '@/features/sso/pages/SsoValidatePage';
import { ListingPage } from '@/features/listings/pages/ListingPage';

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
      { path: '/listings/:listingId', element: <ListingPage /> },
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

  // Back-office protégé par rôle (≥ moderator, certaines routes ≥ admin)
  {
    path: '/admin',
    element: <RoleRoute minRole="moderator" />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { index: true, element: <AdminDashboardPage /> },
          {
            path: 'users',
            element: <RoleRoute minRole="admin" />,
            children: [{ index: true, element: <AdminUsersPage /> }],
          },
          { path: 'moderation/listings', element: <ModerationListingsPage /> },
          { path: 'moderation/events', element: <ModerationEventsPage /> },
          { path: 'incidents', element: <AdminIncidentsPage /> },
          { path: 'geo', element: <GeoPage /> },
          { path: 'messages', element: <MessagesPage /> },
          {
            path: 'config',
            element: <RoleRoute minRole="admin" />,
            children: [{ index: true, element: <AdminConfigPage /> }],
          },
          {
            path: 'rgpd',
            element: <RoleRoute minRole="admin" />,
            children: [{ index: true, element: <AdminRgpdPage /> }],
          },
          { path: 'dsl/console', element: <DslConsolePage /> },
          { path: 'dsl/audit', element: <DslAuditPage /> },
          { path: 'dsl/explorer', element: <DslExplorerPage /> },
          { path: 'api-explorer', element: <ApiExplorerPage /> },
        ],
      },
    ],
  },

  { path: '*', element: <NotFoundPage /> },
]);
