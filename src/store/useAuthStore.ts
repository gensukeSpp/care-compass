import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';
import type { Profile, Member } from '../types/index';

export interface User {
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
  currentRoles: Record<string, 'owner' | 'member'>; // profileId -> role

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
   * 現在選択されているプロファイルの選択を解除します。
   * @return :void 戻り値はありません
   */
  deselectProfile: () => void;

  /**
   * 新しいプロファイル（対象者）を作成し、作成者をオーナーとして登録します。
   * @params
   *  name :string - 対象者の名前
   *  labels? :{ can: string; cannot: string; risk: string; request: string } - 象限のカスタムラベル
   * @return :Promise<void>
   */
  createProfile: (name: string, labels?: { can: string; cannot: string; risk: string; request: string }) => Promise<void>;

  /**
   * 象限のラベルを更新します。
   * @params
   *  profileId :string - プロファイルID
   *  labels :{ can: string; cannot: string; risk: string; request: string } - 新しいラベル
   * @return :Promise<void>
   */
  updateProfileLabels: (profileId: string, labels: { can: string; cannot: string; risk: string; request: string }) => Promise<void>;

  /**
   * 招待を受諾し、ボードメンバーとして参加します。
   * @params
   *  token :string - 招待トークン
   * @return :Promise<string> 参加したプロファイルID
   */
  acceptInvitation: (token: string) => Promise<string>;
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
      currentRoles: {},

      login: async () => {
        set({ isLoading: true, error: null });
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
        set({ currentUser: null, isLoggedIn: false, currentProfiles: [], currentProfileId: null, currentRoles: {}, isLoading: false });
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

            // Supabase からプロファイル一覧を取得
            const { data: membersData, error: membersError } = await supabase
              .from('board_members')
              .select('profile_id, role, profiles(*)')
              .eq('user_id', user.id);

            if (membersError) throw membersError;

            const members = membersData as unknown as Member[];
            const profiles = members
              .map((m) => Array.isArray(m.profiles) ? m.profiles[0] : m.profiles)
              .filter((p): p is Profile => !!p);

            const roles: Record<string, 'owner' | 'member'> = {};
            members.forEach((m) => {
              if (m.profile_id) {
                roles[m.profile_id] = m.role;
              }
            });

            // ユーザー情報とプロファイル一覧を同時に設定
            set({
              currentUser: user,
              isLoggedIn: true,
              currentProfiles: profiles,
              currentRoles: roles
            });
          } else {
            set({ currentUser: null, isLoggedIn: false, currentProfiles: [], currentProfileId: null, currentRoles: {} });
          }
        } catch (err) {
          console.error('Auth check error:', err);
          set({
            error: err instanceof Error ? err.message : '認証チェックに失敗しました',
            isLoggedIn: false,
            currentUser: null,
            currentProfiles: [],
            currentRoles: {}
          });
        } finally {
          set({ isLoading: false });
        }
      },

      setError: (error) => set({ error }),

      setUser: (user) => set({ currentUser: user, isLoggedIn: !!user }),

      selectProfile: (profileId) => set({ currentProfileId: profileId }),

      deselectProfile: () => set({ currentProfileId: null }),

      createProfile: async (name, labels) => {
        const { currentUser } = get();
        if (!currentUser) throw new Error('ログインが必要です');

        set({ isLoading: true, error: null });
        try {
          // profiles テーブルと board_members テーブルを単一トランザクションで処理
          const { data: profile, error } = await supabase.rpc('create_profile_with_owner', {
            p_name: name,
            p_can_label: labels?.can?.trim() || undefined,
            p_cannot_label: labels?.cannot?.trim() || undefined,
            p_risk_label: labels?.risk?.trim() || undefined,
            p_request_label: labels?.request?.trim() || undefined
          });

          if (error) throw error;

          const updatedProfiles = [...get().currentProfiles, profile];
          const updatedRoles = { ...get().currentRoles, [profile.id]: 'owner' as const };
          set({
            currentProfiles: updatedProfiles,
            currentRoles: updatedRoles,
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

      updateProfileLabels: async (profileId, labels) => {
        set({ isLoading: true, error: null });
        try {
          const { data: profile, error } = await supabase.rpc('update_profile_labels', {
            p_profile_id: profileId,
            p_can_label: labels.can?.trim() || 'できる',
            p_cannot_label: labels.cannot?.trim() || 'できない',
            p_risk_label: labels.risk?.trim() || '危険を伴う',
            p_request_label: labels.request?.trim() || '頼みたい'
          });

          if (error) throw error;

          const updatedProfiles = get().currentProfiles.map(p => p.id === profileId ? profile : p);
          set({
            currentProfiles: updatedProfiles,
            isLoading: false
          });
        } catch (err) {
          set({
            error: err instanceof Error ? err.message : 'ラベルの更新に失敗しました',
            isLoading: false
          });
          throw err;
        }
      },

      acceptInvitation: async (token) => {
        set({ isLoading: true, error: null });
        try {
          const { data: profileId, error } = await supabase.rpc('accept_invitation', { p_token: token });

          if (error) throw error;

          // 参加に成功したので認証状態（プロファイル一覧）を更新
          await get().checkAuth();

          set({ isLoading: false });
          return profileId;
        } catch (err) {
          set({
            error: err instanceof Error ? err.message : '招待の受諾に失敗しました',
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
        currentProfiles: state.currentProfiles,
        currentRoles: state.currentRoles
      }),
    }
  )
);
