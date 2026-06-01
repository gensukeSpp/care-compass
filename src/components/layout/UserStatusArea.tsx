import type { User } from '../../store/useAuthStore';
import { LoginButton } from '../auth/LoginButton';
import { LogoutButton } from '../auth/LogoutButton';
import { DashboardLink } from './DashboardLink';

interface UserStatusAreaProps {
  currentUser: User | null;
  isLoggedIn: boolean;
}

export function UserStatusArea({ currentUser, isLoggedIn }: UserStatusAreaProps) {
  return (
    <div className="flex items-center gap-2 sm:gap-6 flex-wrap justify-end flex-1 sm:flex-initial">
      {/* 操作ボタン (ボード一覧、招待) */}
      <div className="flex items-center gap-1 sm:gap-2">
        {isLoggedIn && <DashboardLink isLoggedIn={isLoggedIn} />}
      </div>

      {/* ユーザー情報 / ログイン */}
      <div className="flex items-center gap-3 border-l border-gray-100 pl-3 sm:pl-6 ml-1 sm:ml-0">
        {isLoggedIn && currentUser ? (
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-gray-700 leading-tight">{currentUser.name}</p>
              <p className="text-[10px] text-gray-400 leading-tight">{currentUser.email}</p>
            </div>
            {currentUser.picture && (
              <img
                src={currentUser.picture}
                alt={currentUser.name}
                className="w-8 h-8 rounded-full border border-gray-200"
              />
            )}
            <LogoutButton />
          </div>
        ) : (
          <LoginButton />
        )}
      </div>
    </div>
  );
}