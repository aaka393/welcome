import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';

const RequireAuthRedirect = () => {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const authState = useAuthStore(state => state.authState);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const protectedRoutes = ['/booking', '/payment', '/session', '/admin'];
    const isProtectedRoute = protectedRoutes.some(route => 
      location.pathname.startsWith(route)
    );

    // Redirect unauthenticated users from protected routes to login
    if (
      !isAuthenticated &&
      authState === 'invalid' &&
      isProtectedRoute &&
      location.pathname !== '/admin'
    ) {
      navigate('/', { replace: true });
    }

    // Special handling for admin route
    if (
      location.pathname === '/admin' &&
      isAuthenticated &&
      authState === 'valid'
    ) {
      const user = useAuthStore.getState().user;
      if (user && user.role?.toLowerCase() !== 'admin') {
        navigate('/', { replace: true });
      }
    }

  }, [isAuthenticated, authState, location.pathname, navigate]);

  return null;
};

export default RequireAuthRedirect;