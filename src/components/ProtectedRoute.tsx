import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  let authContext;
  try {
    authContext = useAuth();
  } catch (error) {
    // If context is not available (e.g., during hot reload), redirect to login
    console.error('Auth context not available:', error);
    return <Navigate to="/login" replace />;
  }

  const { user, isAuthenticated } = authContext;
  const location = useLocation();

  // If not authenticated, redirect to login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location, role: requiredRole }} replace />;
  }

  // Check if profile needs updating (skip for admin and if already on update-profile page)
  const needsProfileUpdate = !user.profileUpdated && !user.profile_updated;
  if (needsProfileUpdate && user.role !== 'admin' && location.pathname !== '/update-profile') {
    return <Navigate to="/update-profile" replace />;
  }

  // If role is required and doesn't match, redirect to appropriate dashboard
  if (requiredRole && user.role !== requiredRole) {
    const roleRoutes: Record<UserRole, string> = {
      admin: '/admin',
      teacher: '/teacher',
      parent: '/parent',
      teen: '/teen',
    };
    return <Navigate to={roleRoutes[user.role] || '/login'} replace />;
  }

  return <>{children}</>;
}

