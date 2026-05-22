import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { useWebShareTarget } from "../../hooks/useWebShareTarget";
import { InviteModal } from "../invitation/InviteModal";
import { useProfileRedirect } from "../../hooks/useProfileRedirect";
import { useHeaderState } from "../../hooks/useHeaderState";

/**
 * アプリケーションのメインレイアウトコンポーネントです。
 * 共通ヘッダー、ナビゲーション、プロファイル選択状態の管理、および招待モーダルの制御を行います。
 * @return :React.FC メインレイアウトコンポーネント
 */
export function MainLayout() {
  const { isLoggedIn, currentUser, isInviteModalOpen, setIsInviteModalOpen, currentProfile, isOwner } = useHeaderState()

  useProfileRedirect();
  // Web Share Target 処理
  useWebShareTarget();

  return (
    <div className="h-svh flex flex-col">
      <Header currentProfile={currentProfile} currentUser={currentUser} isLoggedIn={isLoggedIn} isOwner={isOwner} setIsInviteModalOpen={setIsInviteModalOpen} />

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