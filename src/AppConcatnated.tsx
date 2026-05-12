import { useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import { useStore } from './store/useStore';
import { LoginButton } from './components/auth/LoginButton';
import { LogoutButton } from './components/auth/LogoutButton';
import { AuthCallback } from './pages/AuthCallback';
import { BoardPage } from './components/board/BoardPage';
import { DashboardPage } from './pages/DashboardPage';
import { LayoutGrid } from 'lucide-react';

/**
 * アプリケーションのルートコンポーネントです。認証状態の監視、ルーティング、および共通ヘッダーの管理を行います。
 * @return :JSX.Element アプリケーションのメインレイアウト
 */
function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const currentUser = useAuthStore((state) => state.currentUser);
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const currentProfileId = useAuthStore((state) => state.currentProfileId);
  const currentProfiles = useAuthStore((state) => state.currentProfiles);
  const deselectProfile = useAuthStore((state) => state.deselectProfile);

  const currentProfile = currentProfiles.find((p) => p.id === currentProfileId);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // プロファイル未選択時のダッシュボード誘導
  useEffect(() => {
    if (isLoggedIn && !currentProfileId && location.pathname !== '/dashboard' && location.pathname !== '/auth/callback') {
      navigate('/dashboard');
    }
  }, [isLoggedIn, currentProfileId, location.pathname, navigate]);

  // Web Share Target 処理
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const title = urlParams.get('title');
    const text = urlParams.get('text');
    const url = urlParams.get('url');

    if (title || text || url) {
      const { addPendingNote } = useStore.getState();
      const content = [text, url].filter(Boolean).join('\n\n');
      addPendingNote(title || 'Shared Note', content, 'house');

      // パラメータをクリアするために URL をクリーンアップ
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

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
          )}
        </div>

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
      </header>

      {/* メインコンテンツエリア */}
      <main className="flex-1 relative overflow-hidden">
        <Routes>
          <Route path="/" element={<BoardPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
