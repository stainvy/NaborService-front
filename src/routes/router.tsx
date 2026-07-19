import { createBrowserRouter } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { RoleRoute } from './RoleRoute';
import { NotFoundPage } from './NotFoundPage';
import { HabitantLayout } from '@/components/HabitantLayout';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { RegisterPage } from '@/features/auth/pages/RegisterPage';
import { ForgotPasswordPage } from '@/features/auth/pages/ForgotPasswordPage';
import { ResetPasswordPage } from '@/features/auth/pages/ResetPasswordPage';
import { SessionsPage } from '@/features/auth/pages/SessionsPage';
import { HomePage } from '@/features/home/pages/HomePage';
import { AdminLayout } from '@/features/admin/components/AdminLayout';
import { AdminDashboardPage } from '@/features/admin/pages/AdminDashboardPage';
import { AdminUsersPage } from '@/features/admin/pages/AdminUsersPage';
import { AdminPointsPage } from '@/features/admin/pages/AdminPointsPage';
import { ModerationListingsPage } from '@/features/admin/pages/ModerationListingsPage';
import { ModerationEventsPage } from '@/features/admin/pages/ModerationEventsPage';
import { AdminIncidentsPage } from '@/features/admin/pages/AdminIncidentsPage';
import { AdminMessagesPage } from '@/features/admin/pages/AdminMessagesPage';
import { GeoPage } from '@/features/admin/pages/GeoPage';
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
import { MessagingPage } from '@/features/chat/pages/MessagingPage';
import { GroupSettingsPage } from '@/features/chat/pages/GroupSettingsPage';
import { GroupMembersPage } from '@/features/chat/pages/GroupMembersPage';
import { ListingsFeedPage } from '@/features/listings/pages/ListingsFeedPage';
import { ListingDetailPage } from '@/features/listings/pages/ListingDetailPage';
import { ListingCreatePage } from '@/features/listings/pages/ListingCreatePage';
import { ListingEditPage } from '@/features/listings/pages/ListingEditPage';
import { MyListingsPage } from '@/features/listings/pages/MyListingsPage';
import { MyOperationsPage } from '@/features/listings/pages/MyOperationsPage';
import { SignDocumentPage } from '@/features/listings/pages/SignDocumentPage';
import { PointsPage } from '@/features/points/pages/PointsPage';
import { EventsFeedPage } from '@/features/events/pages/EventsFeedPage';
import { EventCreatePage } from '@/features/events/pages/EventCreatePage';
import { EventDetailPage } from '@/features/events/pages/EventDetailPage';
import { EventEditPage } from '@/features/events/pages/EventEditPage';
import { MyEventsPage } from '@/features/events/pages/MyEventsPage';

export const router = createBrowserRouter([
  // Routes publiques
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  { path: '/forgot-password', element: <ForgotPasswordPage /> },
  { path: '/reset-password', element: <ResetPasswordPage /> },

  // Zone habitant protégée (session requise), sous la coquille HabitantLayout
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <HabitantLayout />,
        children: [
          { path: '/', element: <HomePage /> },
          { path: '/profile', element: <ProfilePage /> },
          { path: '/profile/edit', element: <ProfileEditPage /> },
          { path: '/security', element: <SecurityPage /> },
          { path: '/settings/notifications', element: <NotificationPreferencesPage /> },
          { path: '/privacy', element: <PrivacyPage /> },
          { path: '/sessions', element: <SessionsPage /> },
          { path: '/points', element: <PointsPage /> },
          { path: '/discover', element: <DiscoverPage /> },
          { path: '/search', element: <SearchPage /> },
          { path: '/chat', element: <MessagingPage /> },
          { path: '/chat/:groupId', element: <MessagingPage /> },
          { path: '/chat/:groupId/settings', element: <GroupSettingsPage /> },
          { path: '/chat/:groupId/members', element: <GroupMembersPage /> },
          { path: '/users/:id', element: <PublicProfilePage /> },
          { path: '/auth/sso/qr/validate', element: <SsoValidatePage /> },

          // Annonces & services (la page détail intègre le retour paiement Stripe)
          { path: '/listings', element: <ListingsFeedPage /> },
          { path: '/listings/new', element: <ListingCreatePage /> },
          { path: '/listings/:listingId', element: <ListingDetailPage /> },
          { path: '/listings/:listingId/edit', element: <ListingEditPage /> },
          { path: '/listings/:listingId/sign', element: <SignDocumentPage /> },
          { path: '/my-listings', element: <MyListingsPage /> },
          { path: '/my-operations', element: <MyOperationsPage /> },

          // Événements
          { path: '/events', element: <EventsFeedPage /> },
          { path: '/events/new', element: <EventCreatePage /> },
          { path: '/events/:eventId', element: <EventDetailPage /> },
          { path: '/events/:eventId/edit', element: <EventEditPage /> },
          { path: '/my-events', element: <MyEventsPage /> },
        ],
      },
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
          { path: 'messages', element: <AdminMessagesPage /> },
          { path: 'incidents', element: <AdminIncidentsPage /> },
          { path: 'geo', element: <GeoPage /> },
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
          {
            path: 'points',
            element: <RoleRoute minRole="admin" />,
            children: [{ index: true, element: <AdminPointsPage /> }],
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
