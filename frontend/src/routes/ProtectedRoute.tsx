import { Navigate, Outlet } from 'react-router-dom';
import { authService } from '../services/authService';
import { Role } from '../types/auth';

interface ProtectedRouteProps {
  requiredRole?: Role;
}

const ProtectedRoute = ({ requiredRole }: ProtectedRouteProps) => {
  const isAuthenticated = authService.isAuthenticated();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && !authService.hasRole(requiredRole)) {
    // If user is authenticated but doesn't have the role, redirect to a default authorized page
    if (authService.hasRole(Role.Admin)) {
      return <Navigate to="/admin" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
