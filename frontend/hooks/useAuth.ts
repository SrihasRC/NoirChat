import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/chat.store';

export const useAuth = () => {
  const { isAuthenticated, user, setUser } = useAuthStore();
  const [isInitialized, setIsInitialized] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Ensure we're on the client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    console.log('useAuth - initializing on client. Zustand isAuthenticated:', isAuthenticated, 'user:', user);
    
    const initializeAuth = () => {
      // If already authenticated in Zustand, we're good
      if (isAuthenticated && user) {
        console.log('useAuth - already authenticated in Zustand');
        setIsInitialized(true);
        return;
      }

      // Try to restore from localStorage
      const savedUser = localStorage.getItem('user');
      const savedToken = localStorage.getItem('token');

      console.log('useAuth - checking localStorage. user:', !!savedUser, 'token:', !!savedToken);

      if (savedUser && savedToken) {
        try {
          const userObj = JSON.parse(savedUser);
          console.log('useAuth - restoring user from localStorage:', userObj);
          setUser(userObj);
        } catch (error) {
          console.error('useAuth - error parsing saved user:', error);
          localStorage.removeItem('user');
          localStorage.removeItem('token');
        }
      } else {
        console.log('useAuth - no authentication data found');
      }

      setIsInitialized(true);
    };

    initializeAuth();
  }, [isClient, isAuthenticated, user, setUser]);

  // Only consider authentication state after client-side initialization
  const computedIsAuthenticated = isClient && (isAuthenticated || 
    (localStorage.getItem('user') && localStorage.getItem('token')));

  console.log('useAuth - returning. isClient:', isClient, 'isAuthenticated:', computedIsAuthenticated, 'isInitialized:', isInitialized);

  return {
    isAuthenticated: computedIsAuthenticated,
    user,
    isInitialized: isInitialized && isClient,
  };
};
