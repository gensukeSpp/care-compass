import { type Profile } from '../../types/index';
import type { User } from '../../store/useAuthStore';
import { LoginButton } from '../auth/LoginButton';
import { LogoutButton } from '../auth/LogoutButton';
import { DashboardLink } from './DashboardLink';
import { InviteAction } from '../invitation/InviteAction';
import { useMenu } from '../../hooks/useMenu';

interface HeaderMenuProps {
  currentProfile: Profile | undefined;
  currentUser: User | null;
  isLoggedIn: boolean;
  isOwner: boolean;
  setIsInviteModalOpen: (isOpen: boolean) => void;
  setIsSettingsOpen?: (isOpen: boolean) => void;
}

export function HeaderMenu({ currentProfile, currentUser, isLoggedIn, isOwner, setIsInviteModalOpen, setIsSettingsOpen }: HeaderMenuProps) {
  const { isOpen, setIsOpen, ref } = useMenu();

  return (
    <div className="relative flex items-center" ref={ref}>
      <button
        type="button"
        className="p-2 rounded hover:bg-gray-100"
        onClick={() => setIsOpen((s) => !s)}
        aria-expanded={isOpen}
        aria-label="Open menu"
      >
        {isOpen ? (
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded shadow-lg z-50">
          <div className="p-3 flex flex-col gap-2">
            {isLoggedIn && <DashboardLink isLoggedIn={isLoggedIn} />}

            {currentProfile && isOwner && (
              <>
                <button
                  type="button"
                  className="w-full text-left px-3 py-2 text-sm bg-gray-50 rounded hover:bg-gray-100"
                  onClick={() => { setIsSettingsOpen?.(true); setIsOpen(false); }}
                >
                  設定
                </button>

                <div className="px-1">
                  <InviteAction
                    currentProfile={currentProfile}
                    isOwner={isOwner}
                    setIsInviteModalOpen={setIsInviteModalOpen}
                  />
                </div>
              </>
            )}

            <div className="border-t border-gray-100 pt-2">
              {isLoggedIn && currentUser ? (
                <div className="flex items-start gap-3">
                  {currentUser.picture && (
                    <img src={currentUser.picture} alt={currentUser.name} className="w-8 h-8 rounded-full border border-gray-200" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700">{currentUser.name}</p>
                    <p className="text-xs text-gray-400">{currentUser.email}</p>
                    <div className="mt-2">
                      <LogoutButton />
                    </div>
                  </div>
                </div>
              ) : (
                <LoginButton />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}