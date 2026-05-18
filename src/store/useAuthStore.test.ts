import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAuthStore } from './useAuthStore';

// Mock fetch
global.fetch = vi.fn();

// Mock supabase
vi.mock('../lib/supabase', () => {
  const mockAuth = {
    signInWithOAuth: vi.fn(() => Promise.resolve({ error: null })),
    signOut: vi.fn(() => Promise.resolve({ error: null })),
    getSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
  };
  const mockFrom = vi.fn().mockReturnValue({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ data: [], error: null }),
    }),
    insert: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: { id: 'p1', name: 'Profile 1' }, error: null }),
      }),
    }),
  });
  const mockRpc = vi.fn().mockResolvedValue({ data: { id: 'p1', name: 'Profile 1' }, error: null });

  return {
    supabase: {
      auth: mockAuth,
      from: mockFrom,
      rpc: mockRpc,
    },
  };
});

import { supabase } from '../lib/supabase';

describe('useAuthStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // ストアのリセット
    useAuthStore.setState({
      currentUser: null,
      isLoggedIn: false,
      isLoading: false,
      error: null,
      currentProfileId: null,
      currentProfiles: [],
      currentRoles: {},
    });
  });

  it('初期状態が正しいこと', () => {
    const state = useAuthStore.getState();
    expect(state.currentUser).toBeNull();
    expect(state.isLoggedIn).toBe(false);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
    expect(state.currentProfileId).toBeNull();
    expect(state.currentProfiles).toEqual([]);
    expect(state.currentRoles).toEqual({});
  });

  it('login が supabase.auth.signInWithOAuth を呼び出すこと', async () => {
    const { login } = useAuthStore.getState();
    await login();

    expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: 'google',
      })
    );
  });

  it('checkAuth が成功したときにユーザー情報を設定すること', async () => {
    const mockUser = {
      id: 'u123',
      email: 'test@example.com',
      user_metadata: {
        full_name: 'Test User',
        avatar_url: 'http://example.com/avatar.png',
      },
    };
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: { user: mockUser } },
      error: null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    const mockMembers = [
      {
        profile_id: 'p1',
        role: 'owner',
        profiles: { id: 'p1', name: 'Profile 1' }
      }
    ];
    vi.mocked(supabase.from('board_members').select).mockReturnValue({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      eq: vi.fn().mockResolvedValue({ data: mockMembers, error: null }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    const { checkAuth } = useAuthStore.getState();
    await checkAuth();

    const state = useAuthStore.getState();
    expect(state.currentUser).toEqual({
      id: 'u123',
      email: 'test@example.com',
      name: 'Test User',
      picture: 'http://example.com/avatar.png',
    });
    expect(state.isLoggedIn).toBe(true);
    expect(state.currentProfiles).toHaveLength(1);
    expect(state.currentRoles).toEqual({ 'p1': 'owner' });
    expect(state.isLoading).toBe(false);
  });

  it('checkAuth でユーザーが見つからない場合にログイン状態を解除すること', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    // ログイン状態から開始
    useAuthStore.setState({ isLoggedIn: true, currentUser: { id: '1', email: 'a@b.com', name: 'A' } });

    const { checkAuth } = useAuthStore.getState();
    await checkAuth();

    const state = useAuthStore.getState();
    expect(state.currentUser).toBeNull();
    expect(state.isLoggedIn).toBe(false);
  });

  it('checkAuth が失敗したときにエラーを設定すること', async () => {
    vi.mocked(supabase.auth.getSession).mockRejectedValue(new Error('Network Error'));

    const { checkAuth } = useAuthStore.getState();
    await checkAuth();

    const state = useAuthStore.getState();
    expect(state.error).toBe('Network Error');
    expect(state.isLoggedIn).toBe(false);
    expect(state.isLoading).toBe(false);
  });

  it('logout が supabase.auth.signOut を呼び出すこと', async () => {
    const { logout } = useAuthStore.getState();
    
    // window.location.href のモック
    const originalLocation = window.location;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any).location;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    window.location = { ...originalLocation, href: '' } as any;

    await logout();

    expect(supabase.auth.signOut).toHaveBeenCalled();
    expect(useAuthStore.getState().isLoggedIn).toBe(false);
    
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: originalLocation,
    });
  });

  it('setUser でユーザー情報を直接設定できること', () => {
    const mockUser = { id: '456', email: 'user@test.com', name: 'New User' };
    const { setUser } = useAuthStore.getState();

    setUser(mockUser);

    const state = useAuthStore.getState();
    expect(state.currentUser).toEqual(mockUser);
    expect(state.isLoggedIn).toBe(true);

    setUser(null);
    expect(useAuthStore.getState().isLoggedIn).toBe(false);
  });

  it('setError でエラーメッセージを設定できること', () => {
    const { setError } = useAuthStore.getState();
    setError('Test Error');
    expect(useAuthStore.getState().error).toBe('Test Error');
  });

  it('createProfile がプロファイルを作成し、状態を更新すること', async () => {
    const mockUser = { id: 'u1', email: 'u1@test.com', name: 'User 1' };
    useAuthStore.setState({ currentUser: mockUser, isLoggedIn: true });

    vi.mocked(supabase.rpc).mockResolvedValue({
      data: { id: 'p1', name: 'Profile 1' },
      error: null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    const { createProfile } = useAuthStore.getState();
    await createProfile('New Board');

    const state = useAuthStore.getState();
    expect(state.currentProfiles).toHaveLength(1);
    expect(state.currentProfiles[0].name).toBe('Profile 1');
    expect(state.currentProfileId).toBe('p1');
    expect(state.currentRoles['p1']).toBe('owner');
    expect(state.isLoading).toBe(false);
  });

  describe('acceptInvitation', () => {
    it('招待の受諾に成功し、プロファイル一覧を更新すること', async () => {
      const mockToken = 'valid-token';
      const mockProfileId = 'new-profile-id';
      
      // RPCのモック
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: mockProfileId,
        error: null,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);
      
      // checkAuthのためのgetSessionモック
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: { user: { id: 'u1', email: 'u@test.com', user_metadata: {} } } },
        error: null,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      // checkAuthのためのboard_membersモック
      vi.mocked(supabase.from('board_members').select).mockReturnValue({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        eq: vi.fn().mockResolvedValue({ 
          data: [{ profile_id: mockProfileId, role: 'member', profiles: { id: mockProfileId, name: 'New Board' } }], 
          error: null 
        }),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      const { acceptInvitation } = useAuthStore.getState();
      const result = await acceptInvitation(mockToken);

      expect(supabase.rpc).toHaveBeenCalledWith('accept_invitation', { p_token: mockToken });
      expect(result).toBe(mockProfileId);
      
      const state = useAuthStore.getState();
      expect(state.currentProfiles).toHaveLength(1);
      expect(state.currentProfiles[0].id).toBe(mockProfileId);
      expect(state.currentRoles[mockProfileId]).toBe('member');
      expect(state.isLoading).toBe(false);
    });

    it('RPCがエラーを返した場合、エラー状態を設定して例外を投げること', async () => {
      const mockToken = 'invalid-token';
      const mockError = new Error('Invalid token');
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: null,
        error: mockError as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      const { acceptInvitation } = useAuthStore.getState();
      
      await expect(acceptInvitation(mockToken)).rejects.toThrow('Invalid token');
      
      const state = useAuthStore.getState();
      expect(state.error).toBe('Invalid token');
      expect(state.isLoading).toBe(false);
    });
  });
});
