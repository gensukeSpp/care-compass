import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

interface AuthState {
  currentUser: User | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  error: string | null;

  // アクション
  /**
   * ログイン処理を開始します。バックエンドの認証エンドポイントへリダイレクトします。
   */
  login: () => void;
  /**
   * ログアウト処理を実行します。
   */
  logout: () => void;
  /**
   * 現在の認証状態をバックエンド API を用いて確認します。
   * @return :Promise<void>
   */
  checkAuth: () => Promise<void>;
  /**
   * エラー状態を設定します。
   * @params
   *  error :string | null - 設定するエラーメッセージ
   */
  setError: (error: string | null) => void;
  /**
   * ユーザー情報を直接設定します（コールバック時などに使用）。
   * @params
   *  user :User | null - 設定するユーザー情報
   */
  setUser: (user: User | null) => void;
}

const getApiBaseUrl = () => {
  const url = import.meta.env.VITE_API_BASE_URL?.trim();
  if (!url) return '';

  try {
    const parsed = new URL(url);
    const isConfiguredLocalhost = parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';
    const isRuntimeLocalhost =
      typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

    // 本番ホストで localhost が埋め込まれている場合は無視して同一オリジンにフォールバックする
    if (isConfiguredLocalhost && !isRuntimeLocalhost) {
      return '';
    }

    return url.replace(/\/+$/, '');
  } catch {
    return '';
  }
};

const API_BASE_URL = getApiBaseUrl();

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      currentUser: null,
      isLoggedIn: false,
      isLoading: false,
      error: null,

      login: () => {
        const target = `${API_BASE_URL}/api/auth/google`;
        console.log(`Redirecting to: ${target}`);
        window.location.href = target;
      },

      logout: () => {
        set({ isLoading: true });
        window.location.href = `${API_BASE_URL}/api/auth/logout`;
      },

      checkAuth: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch(`${API_BASE_URL}/api/auth/me`);
          const data = await response.json();
          if (data.user) {
            set({ currentUser: data.user, isLoggedIn: true, isLoading: false });
          } else {
            set({ currentUser: null, isLoggedIn: false, isLoading: false });
          }
        } catch (err) {
          set({
            error: err instanceof Error ? err.message : '認証チェックに失敗しました',
            isLoading: false,
            isLoggedIn: false,
          });
        }
      },

      setError: (error) => set({ error }),

      setUser: (user) => set({ currentUser: user, isLoggedIn: !!user }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ currentUser: state.currentUser, isLoggedIn: state.isLoggedIn }),
    }
  )
);
