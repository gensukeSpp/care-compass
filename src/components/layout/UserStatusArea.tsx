import { type Profile } from '../../types/index';
import type { User } from '../../store/useAuthStore';
import { LoginButton } from '../auth/LoginButton';
import { LogoutButton } from '../auth/LogoutButton';
import { DashboardLink } from './DashboardLink';
import { InviteAction } from '../invitation/InviteAction';

interface UserStatusAreaProps {
  currentProfile: Profile | undefined;
  currentUser: User | null;
  isLoggedIn: boolean;
  isOwner: boolean;
  setIsInviteModalOpen: (isOpen: boolean) => void;
  setIsSettingsOpen?: (isOpen: boolean) => void;
}

export function UserStatusArea({ currentProfile, currentUser, isLoggedIn, isOwner, setIsInviteModalOpen, setIsSettingsOpen }: UserStatusAreaProps) {
  return (
    <div className="flex items-center gap-2 sm:gap-6 flex-wrap justify-end flex-1 sm:flex-initial">
      {/* 操作ボタン (ボード一覧、招待) */}
      <div className="flex items-center gap-1 sm:gap-2">
        {isLoggedIn && <DashboardLink isLoggedIn={isLoggedIn} />}
        {currentProfile && isOwner && (
          <>
            <button
              type="button"
              className="px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200 mr-1"
              onClick={() => setIsSettingsOpen?.(true)}
              aria-label="Open board settings"
            >
              設定
            </button>

            <InviteAction
              currentProfile={currentProfile}
              isOwner={isOwner}
              setIsInviteModalOpen={setIsInviteModalOpen}
            />
          </>
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
  );
}