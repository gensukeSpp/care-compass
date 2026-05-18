import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import { useAuthStore } from '../store/useAuthStore';

export const useProfileRedirect = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const currentProfileId = useAuthStore((state) => state.currentProfileId);

  // プロファイル未選択時のダッシュボード誘導
  useEffect(() => {
    if (isLoggedIn && !currentProfileId && location.pathname !== '/dashboard' && location.pathname !== '/auth/callback' && location.pathname !== '/join') {
      navigate('/dashboard');
    }
  }, [isLoggedIn, currentProfileId, location.pathname, navigate]);

}