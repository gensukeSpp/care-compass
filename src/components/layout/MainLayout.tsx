import { useEffect, useState } from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { LayoutGrid, UserPlus } from 'lucide-react';
import { useAuthStore } from "../../store/useAuthStore";
import { Header } from "./Header";
import { useWebShareTarget } from "../../hooks/useWebShareTarget";
import { InviteModal } from "../board/InviteModal";

/**
 * アプリケーションのメインレイアウトコンポーネントです。
 * 共通ヘッダー、ナビゲーション、プロファイル選択状態の管理、および招待モーダルの制御を行います。
 * @return :React.FC メインレイアウトコンポーネント
 */
export function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = useAuthStore((state) => state.currentUser);
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const currentProfileId = useAuthStore((state) => state.currentProfileId);
  const currentProfiles = useAuthStore((state) => state.currentProfiles);
  const currentRoles = useAuthStore((state) => state.currentRoles);
  const deselectProfile = useAuthStore((state) => state.deselectProfile);

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  const currentProfile = currentProfiles.find((p) => p.id === currentProfileId);
  const isOwner = currentProfileId ? currentRoles[currentProfileId] === 'owner' : false;

  // プロファイル未選択時のダッシュボード誘導
  useEffect(() => {
    if (isLoggedIn && !currentProfileId && location.pathname !== '/dashboard' && location.pathname !== '/auth/callback' && location.pathname !== '/join') {
      navigate('/dashboard');
    }
  }, [isLoggedIn, currentProfileId, location.pathname, navigate]);

  // Web Share Target 処理
  useWebShareTarget();

  return (
    <div className="min-h-screen flex flex-col">
      {/* 共通ヘッダー */}
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

          {isLoggedIn && (
            <div className="flex items-center gap-2">
              <Link
                to="/dashboard"
                onClick={() => deselectProfile()}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${location.pathname === '/dashboard'
                  ? 'bg-indigo-50 text-indigo-600 font-medium'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                  }`}
              >
                <LayoutGrid className="w-4 h-4" />
                <span className="text-sm">ボード一覧</span>
              </Link>

              {currentProfile && isOwner && (
                <button
                  onClick={() => setIsInviteModalOpen(true)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-all"
                >
                  <UserPlus className="w-4 h-4" />
                  <span className="text-sm">招待</span>
                </button>
              )}
            </div>
          )}
        </div>

        <Header currentUser={currentUser} isLoggedIn={isLoggedIn} />
      </header>

      {/* メインコンテンツエリア */}
      <main className="flex-1 relative overflow-hidden">
        <Outlet />
      </main>

      {/* 招待モーダル */}
      {currentProfile && (
        <InviteModal
          isOpen={isInviteModalOpen}
          onClose={() => setIsInviteModalOpen(false)}
          profileId={currentProfile.id}
          profileName={currentProfile.name}
        />
      )}
    </div>
  );
}