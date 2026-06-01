import { Link } from 'react-router-dom';
import { type Profile } from '../../types/index';
import type { User } from '../../store/useAuthStore';
import { HeaderMenu } from './HeaderMenu';
import { UserStatusArea } from './UserStatusArea';

interface HeaderProps {
  currentProfile: Profile | undefined;
  currentUser: User | null;
  isLoggedIn: boolean;
  isOwner: boolean;
  setIsInviteModalOpen: (isOpen: boolean) => void;
  setIsSettingsOpen?: (isOpen: boolean) => void;
}

/**
 * ヘッダーコンポーネントです。プロファイル名、アクションボタン、ユーザー情報を表示します。
 * モバイル対応のため、要素が多すぎる場合は折り返しを許可します。
 */
export function Header({ currentProfile, currentUser, isLoggedIn, isOwner, setIsInviteModalOpen, setIsSettingsOpen }: HeaderProps) {
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

      {/* 右側: ハンバーガーメニュー（ボードを開いているときにまとめる） */}
      {currentProfile ? (
        <HeaderMenu
          currentProfile={currentProfile}
          currentUser={currentUser}
          isLoggedIn={isLoggedIn}
          isOwner={isOwner}
          setIsInviteModalOpen={setIsInviteModalOpen}
          setIsSettingsOpen={setIsSettingsOpen}
        />
      ) : (
        <UserStatusArea
          currentUser={currentUser}
          isLoggedIn={isLoggedIn}
        />
      )}
    </header>
  );
}