import { useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';

export const useAuthGuard = () => {
  const checkAuth = useAuthStore((state) => state.checkAuth);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);
}