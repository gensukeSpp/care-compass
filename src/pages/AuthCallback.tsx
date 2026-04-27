import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

/**
 * Google OAuth 2.0 のコールバックを処理するページコンポーネント
 */
export const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const setError = useAuthStore((state) => state.setError);

  useEffect(() => {
    const resolveApiBaseUrl = () => {
      const configuredUrl = import.meta.env.VITE_API_BASE_URL?.trim();
      if (!configuredUrl) return '';

      try {
        const parsed = new URL(configuredUrl);
        const isConfiguredLocalhost = parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';
        const isRuntimeLocalhost =
          window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

        // 本番ホストで localhost が埋め込まれている場合は無視して同一オリジンにフォールバックする
        if (isConfiguredLocalhost && !isRuntimeLocalhost) {
          return '';
        }

        return configuredUrl.replace(/\/+$/, '');
      } catch {
        return '';
      }
    };

    const searchParams = new URLSearchParams(location.search);
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (!code) {
      setError('認可コードが見つかりません');
      navigate('/');
      return;
    }

    const handleCallback = async () => {
      try {
        const API_BASE_URL = resolveApiBaseUrl();
        // バックエンドのコールバックエンドポイントを呼び出す
        // バックエンドが 302 Redirect を返すと fetch は自動で追従するが、
        // Cookie はブラウザによって保存される。
        const response = await fetch(`${API_BASE_URL}/api/auth/google/callback?code=${code}&state=${state}`, {
          // Cookie（session等）を確実に受け取るため
          credentials: 'include',
        });

        if (response.ok) {
          // セッション確立後に最新のユーザー情報を取得してストアを更新
          await checkAuth();
          navigate('/');
        } else {
          setError('認証に失敗しました');
          navigate('/');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '認証処理中にエラーが発生しました');
        navigate('/');
      }
    };

    handleCallback();
  }, [location, navigate, checkAuth, setError]);

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
