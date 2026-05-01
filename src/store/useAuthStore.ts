import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';
import type { Profile } from '../types/index';

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

  // プロファイル関連の状態
  currentProfileId: string | null;
  currentProfiles: Profile[];

  // アクション
  /**
   * ログイン処理を開始します。Supabase OAuth (Google) へリダイレクトします。
   */
  login: () => Promise<void>;
  /**
   * ログアウト処理を実行します。
   */
  logout: () => Promise<void>;
  /**
   * 現在の認証状態を Supabase SDK を用いて確認します。
   * ログイン済みの場合は Supabase からアクセス可能なプロファイル一覧を取得します。
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
   * ユーザー情報を直接設定します。
   * @params
   *  user :User | null - 設定するユーザー情報
   */
  setUser: (user: User | null) => void;

  /**
   * 使用するプロファイルを選択します。
   * @params
   *  profileId :string - 選択するプロファイルID
   */
  selectProfile: (profileId: string) => void;

  /**
   * 新しいプロファイル（対象者）を作成し、作成者をオーナーとして登録します。
   * @params
   *  name :string - 対象者の名前
   * @return :Promise<void>
   */
  createProfile: (name: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      isLoggedIn: false,
      isLoading: false,
      error: null,
      currentProfileId: null,
      currentProfiles: [],

      login: async () => {
        set({ isLoading: true, error: null });
        console.log(`Callback URL: ${window.location.href}`);
        console.log(`Current Location: ${window.location.origin}`);
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${window.location.origin}/auth/callback`,
            queryParams: {
              access_type: 'offline',
              prompt: 'consent',
            },
          },
        });
        if (error) {
          set({ error: error.message, isLoading: false });
        }
      },

      logout: async () => {
        set({ isLoading: true });
        await supabase.auth.signOut();
        set({ currentUser: null, isLoggedIn: false, currentProfiles: [], currentProfileId: null, isLoading: false });
        // ローカルストレージをクリアするためにリロードを推奨（オプション）
        window.location.href = '/';
      },

      checkAuth: async () => {
        set({ isLoading: true, error: null });
        try {
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();

          if (sessionError) throw sessionError;

          if (session?.user) {
            const user: User = {
              id: session.user.id,
              email: session.user.email || '',
              name: session.user.user_metadata.full_name || session.user.user_metadata.name || '',
              picture: session.user.user_metadata.avatar_url || session.user.user_metadata.picture,
            };

            set({ currentUser: user, isLoggedIn: true });

            // Supabase からプロファイル一覧を取得
            const { data: members, error: membersError } = await supabase
              .from('board_members')
              .select('profile_id, profiles(*)')
              .eq('user_id', user.id);

            if (membersError) throw membersError;

            const profiles = (members as any[] || [])
              .map((m) => Array.isArray(m.profiles) ? m.profiles[0] : m.profiles)
              .filter((p): p is Profile => !!p);

            set({ currentProfiles: profiles });

            if (profiles.length > 0 && !get().currentProfileId) {
              set({ currentProfileId: profiles[0].id });
            }
          } else {
            set({ currentUser: null, isLoggedIn: false, currentProfiles: [], currentProfileId: null });
          }
        } catch (err) {
          console.error('Auth check error:', err);
          set({
            error: err instanceof Error ? err.message : '認証チェックに失敗しました',
            isLoggedIn: false,
          });
        } finally {
          set({ isLoading: false });
        }
      },

      setError: (error) => set({ error }),

      setUser: (user) => set({ currentUser: user, isLoggedIn: !!user }),

      selectProfile: (profileId) => set({ currentProfileId: profileId }),

      createProfile: async (name) => {
        const { currentUser } = get();
        if (!currentUser) throw new Error('ログインが必要です');

        set({ isLoading: true, error: null });
        try {
          // 1. profiles テーブルに新規作成
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .insert({ name, created_by: currentUser.id })
            .select()
            .single();

          if (profileError) throw profileError;

          // 2. board_members テーブルにオーナーとして登録
          const { error: memberError } = await supabase
            .from('board_members')
            .insert({
              profile_id: profile.id,
              user_id: currentUser.id,
              role: 'owner'
            });

          if (memberError) throw memberError;

          const updatedProfiles = [...get().currentProfiles, profile];
          set({
            currentProfiles: updatedProfiles,
            currentProfileId: profile.id,
            isLoading: false
          });
        } catch (err) {
          set({
            error: err instanceof Error ? err.message : 'プロファイルの作成に失敗しました',
            isLoading: false
          });
          throw err;
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        currentUser: state.currentUser,
        isLoggedIn: state.isLoggedIn,
        currentProfileId: state.currentProfileId,
        currentProfiles: state.currentProfiles
      }),
    }
  )
);

