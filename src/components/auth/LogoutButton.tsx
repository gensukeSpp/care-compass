import React from 'react';
import { LogOut } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

/**
 * ログアウトを実行するためのボタンコンポーネント
 */
export const LogoutButton: React.FC = () => {
  const logout = useAuthStore((state) => state.logout);
  const isLoading = useAuthStore((state) => state.isLoading);

  return (
    <button
      onClick={() => logout()}
      disabled={isLoading}
      className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
    >
      <LogOut size={16} />
      <span>Sign out</span>
    </button>
  );
};
