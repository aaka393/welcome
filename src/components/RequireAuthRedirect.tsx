import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import { useAdminAuthStore } from '../stores/adminAuthStore';

const RequireAuthRedirect = () => {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const authState = useAuthStore(state => state.authState);
  const adminAuth = useAdminAuthStore(state => ({ 
    isAuthenticated: state.isAuthenticated, 
    user: state.user 
  }));
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const protectedRoutes = ['/booking', '/payment', '/session', '/admin'];
    const isProtectedRoute = protectedRoutes.some(route => 
      location.pathname.startsWith(route)
    );

    // Special handling for admin route
    if (location.pathname === '/admin') {
      // Admin route uses separate auth system
      if (adminAuth.isAuthenticated && adminAuth.user?.role !== 'admin') {
        navigate('/', { replace: true });
      }
      return; // Don't apply regular auth checks to admin route
    }

    // Redirect unauthenticated users from other protected routes to login
    if (
      !isAuthenticated &&
      authState === 'invalid' &&
      isProtectedRoute
    ) {
      navigate('/', { replace: true });
    }

  }, [isAuthenticated, authState, adminAuth.isAuthenticated, adminAuth.user?.role, location.pathname, navigate]);

  return null;
};

export default RequireAuthRedirect;