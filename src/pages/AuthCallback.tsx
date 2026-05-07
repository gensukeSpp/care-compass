import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

/**
 * Supabase Auth / Google OAuth 2.0 のコールバックを処理するページコンポーネント
 */
export const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const setError = useAuthStore((state) => state.setError);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Supabase Auth は URL のハッシュ/クエリから自動的にセッションを確立する
        // ここではストアの状態を最新にするために checkAuth を呼び出す
        await checkAuth();
        navigate('/');
      } catch (err) {
        setError(err instanceof Error ? err.message : '認証処理中にエラーが発生しました');
        navigate('/');
      }
    };

    handleCallback();
  }, [navigate, checkAuth, setError]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="p-8 bg-white rounded-xl shadow-md flex flex-col items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-700">認証を処理しています...</h2>
        <p className="text-gray-500 mt-2">しばらくお待ちください</p>
      </div>
    </div>
  );
};

export default AuthCallback;
