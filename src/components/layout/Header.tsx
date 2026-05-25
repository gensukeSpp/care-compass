import { Link } from 'react-router-dom';
import { type Profile } from '../../types/index';
import type { User } from '../../store/useAuthStore';
import { LoginButton } from '../auth/LoginButton';
import { LogoutButton } from '../auth/LogoutButton';
import { DashboardLink } from './DashboardLink';
import { InviteAction } from '../invitation/InviteAction';

interface HeaderProps {
  currentProfile: Profile | undefined;
  currentUser: User | null;
  isLoggedIn: boolean;
  isOwner: boolean;
  setIsInviteModalOpen: (isOpen: boolean) => void;
}

/**
 * ヘッダーコンポーネントです。プロファイル名、アクションボタン、ユーザー情報を表示します。
 * モバイル対応のため、要素が多すぎる場合は折り返しを許可します。
 */
export function Header({ currentProfile, currentUser, isLoggedIn, isOwner, setIsInviteModalOpen }: HeaderProps) {
  return (
    <header className="min-h-16 flex items-center justify-between px-4 md:px-6 py-2 bg-white border-b border-gray-200 z-50 flex-wrap gap-y-2">
      {/* 左側: プロファイル名 / ロゴ */}
      <Link to="/" className="hover:opacity-80 transition-opacity flex items-center">
        {currentProfile ? (
          <span className="text-base md:text-lg font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full whitespace-nowrap">
            {currentProfile.name}
          </span>
        ) : (
          <span className="text-lg font-bold text-gray-800">Care Compass</span>
        )}
      </Link>

      {/* 右側: アクションボタン群とユーザー情報 */}
      <div className="flex items-center gap-2 sm:gap-6 flex-wrap justify-end flex-1 sm:flex-initial">
        {/* 操作ボタン (ボード一覧、招待) */}
        <div className="flex items-center gap-1 sm:gap-2">
          {isLoggedIn && <DashboardLink isLoggedIn={isLoggedIn} />}
          {currentProfile && isOwner && (
            <InviteAction
              currentProfile={currentProfile}
              isOwner={isOwner}
              setIsInviteModalOpen={setIsInviteModalOpen}
            />
          )}
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
    </header>
  );
}