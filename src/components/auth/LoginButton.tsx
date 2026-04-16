import React from 'react';
import { LogIn } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

/**
 * Google ログインを開始するためのボタンコンポーネント
 */
export const LoginButton: React.FC = () => {
  const login = useAuthStore((state) => state.login);
  const isLoading = useAuthStore((state) => state.isLoading);

  return (
    <button
      onClick={() => login()}
      disabled={isLoading}
      className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
    >
      <LogIn size={18} />
      <span>Sign in with Google</span>
    </button>
  );
};
