import type { User } from '../../store/useAuthStore';
import { LoginButton } from '../auth/LoginButton';
import { LogoutButton } from '../auth/LogoutButton';

interface HeaderProps {
  currentUser: User | null;
  isLoggedIn: boolean;
}

/**
 * ヘッダーの右側に表示される、ユーザー情報とログイン/ログアウトボタンを表示するコンポーネントです。
 */
export function Header({ currentUser, isLoggedIn }: HeaderProps) {
  return (
    <div className="flex items-center gap-4">
      {isLoggedIn && currentUser ? (
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-medium text-gray-700">{currentUser.name}</p>
            <p className="text-xs text-gray-400">{currentUser.email}</p>
          </div>
          {currentUser.picture && (
            <img src={currentUser.picture} alt={currentUser.name} className="w-8 h-8 rounded-full border border-gray-200" />
          )}
          <LogoutButton />
        </div>
      ) : (
        <LoginButton />
      )}
    </div>
  );
}