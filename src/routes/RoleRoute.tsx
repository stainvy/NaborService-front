import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { hasMinRole, type Role } from '@/types/roles';
import { FullPageLoader } from '@/components/FullPageLoader';

export function RoleRoute({ minRole }: { minRole: Role }) {
  const { isAuthenticated, isLoading, role } = useAuth();
  const location = useLocation();

  if (isLoading) return <FullPageLoader />;
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  if (!hasMinRole(role, minRole)) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}
