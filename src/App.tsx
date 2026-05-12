import { Routes, Route } from 'react-router-dom';
import { AuthCallback } from './pages/AuthCallback';
import { BoardPage } from './components/board/BoardPage';
import { DashboardPage } from './pages/DashboardPage';
import { MainLayout } from './components/layout/MainLayout';
import { useAuthGuard } from './hooks/useAuthGuard';

/**
 * アプリケーションのルートコンポーネントです。認証状態の監視、ルーティング、および共通ヘッダーの管理を行います。
 * @return :JSX.Element アプリケーションのメインレイアウト
 */
function App() {
  useAuthGuard();

  return (
    <Routes>
      {/* メインコンテンツエリア */}
      <Route path="/" element={<MainLayout />}>
        <Route index element={<BoardPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
      </Route>
    </Routes>
  );
}

export default App;
