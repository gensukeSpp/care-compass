import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import { useStore } from './store/useStore';
import { LoginButton } from './components/auth/LoginButton';
import { LogoutButton } from './components/auth/LogoutButton';
import { AuthCallback } from './pages/AuthCallback';
import { BoardPage } from './components/board/BoardPage';

/**
 * アプリケーションのルートコンポーネント
 */
function App() {
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const currentUser = useAuthStore((state) => state.currentUser);
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

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
        <h1 className="text-xl font-bold text-gray-800">Care Compass</h1>
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
          <Route path="/auth/google/callback" element={<AuthCallback />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
