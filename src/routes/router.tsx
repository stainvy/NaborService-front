import { createBrowserRouter } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { RoleRoute } from './RoleRoute';
import { NotFoundPage } from './NotFoundPage';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { RegisterPage } from '@/features/auth/pages/RegisterPage';
import { HomePage } from '@/features/home/pages/HomePage';
import { AdminDashboardPage } from '@/features/admin/pages/AdminDashboardPage';
import { ListingPage } from '@/features/listings/pages/ListingPage';

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },

  {
    element: <ProtectedRoute />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/listings/:listingId', element: <ListingPage /> },
    ],
  },

  {
    path: '/admin',
    element: <RoleRoute minRole="moderator" />,
    children: [{ index: true, element: <AdminDashboardPage /> }],
  },

  { path: '*', element: <NotFoundPage /> },
]);
