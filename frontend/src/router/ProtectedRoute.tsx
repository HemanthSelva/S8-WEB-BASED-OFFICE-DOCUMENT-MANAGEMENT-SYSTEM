import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';

interface ProtectedRouteProps {
  allowedRoles?: string[];
}

export const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  console.log('ProtectedRoute Check:', { isAuthenticated, user, allowedRoles, path: window.location.pathname });

  if (!isAuthenticated) {
    console.log('Redirecting to login: Not authenticated');
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    console.log('Redirecting to unauthorized: Role mismatch', { userRole: user.role, allowedRoles });
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};
