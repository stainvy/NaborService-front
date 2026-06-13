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
      { path: '/sessions', element: <SessionsPage /> },
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
