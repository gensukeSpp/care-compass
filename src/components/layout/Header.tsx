import { useState } from 'react';
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
 * ヘッダーの右側に表示される、ユーザー情報とログイン/ログアウトボタンを表示するコンポーネントです。
 */
export function Header({ currentProfile, currentUser, isLoggedIn, isOwner, setIsInviteModalOpen }: HeaderProps) {
  return (
    <header className="h-16 flex items-center justify-between px-6 bg-white border-b border-gray-200 z-50">
      <div className="flex items-center gap-6">
        <Link to="/" className="hover:opacity-80 transition-opacity flex items-center gap-3">
          <h1 className="text-xl font-bold text-gray-800">Care Compass</h1>
          {currentProfile && (
            <div className="flex items-center gap-3">
              <span className="w-px h-6 bg-gray-200" />
              <span className="text-lg font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                {currentProfile.name}
              </span>
            </div>
          )}
        </Link>

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
        {isLoggedIn && <DashboardLink isLoggedIn={isLoggedIn} />}
        {currentProfile && isOwner && <InviteAction currentProfile={currentProfile} isOwner={isOwner} setIsInviteModalOpen={setIsInviteModalOpen} />}
      </div>
    </header>
  );
}