import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAuthStore } from './useAuthStore';
import { redirect } from 'react-router-dom';

// Mock fetch
global.fetch = vi.fn();

describe('useAuthStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // ストアのリセット（永続化されているため、必要に応じて手動でリセット）
    useAuthStore.setState({
      currentUser: null,
      isLoggedIn: false,
      isLoading: false,
      error: null,
    });
  });

  it('初期状態が正しいこと', () => {
    const state = useAuthStore.getState();
    expect(state.currentUser).toBeNull();
    expect(state.isLoggedIn).toBe(false);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('login が適切な URL にリダイレクトすること', () => {
    // window.location.href のモック化は少し工夫が必要だが、ここでは関数の存在を確認
    const originalLocation = window.location;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any).location;
    // window.location = { ...originalLocation, href: '' } as string & Location;
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...originalLocation, href: '' } as Location,
    });

    const { login } = useAuthStore.getState();
    login();

    expect(window.location.href).toContain('/api/auth/google');

    /**
     * ローカル変数より Object.defineProperty が良い理由
     * 「window.location.href の変更を観測すること」なので、
     * 実際に window.location をテスト用オブジェクトへ差し替える必要があります。
     */
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: originalLocation,
    });
  });

  it('checkAuth が成功したときにユーザー情報を設定すること', async () => {
    const mockUser = { id: '123', email: 'test@example.com', name: 'Test User' };
    (fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ user: mockUser }),
    });

    const { checkAuth } = useAuthStore.getState();
    await checkAuth();

    const state = useAuthStore.getState();
    expect(state.currentUser).toEqual(mockUser);
    expect(state.isLoggedIn).toBe(true);
    expect(state.isLoading).toBe(false);
  });

  it('checkAuth でユーザーが見つからない場合にログイン状態を解除すること', async () => {
    (fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ user: null }),
    });

    // ログイン状態から開始
    useAuthStore.setState({ isLoggedIn: true, currentUser: { id: '1', email: 'a@b.com', name: 'A' } });

    const { checkAuth } = useAuthStore.getState();
    await checkAuth();

    const state = useAuthStore.getState();
    expect(state.currentUser).toBeNull();
    expect(state.isLoggedIn).toBe(false);
  });

  it('checkAuth が失敗したときにエラーを設定すること', async () => {
    (fetch as any).mockRejectedValue(new Error('Network Error'));

    const { checkAuth } = useAuthStore.getState();
    await checkAuth();

    const state = useAuthStore.getState();
    expect(state.error).toBe('Network Error');
    expect(state.isLoggedIn).toBe(false);
    expect(state.isLoading).toBe(false);
  });

  it('logout がログアウトエンドポイントにリダイレクトすること', () => {
    const originalLocation = window.location;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any).location;
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...originalLocation, href: '' } as Location,
    });

    const { logout } = useAuthStore.getState();
    logout();

    expect(window.location.href).toContain('/api/auth/logout');
    expect(useAuthStore.getState().isLoading).toBe(true);

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
});
