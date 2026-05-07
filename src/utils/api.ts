export const getApiBaseUrl = (): string => {
  const url = import.meta.env.VITE_API_BASE_URL?.trim();
  if (!url) return '';

  try {
    const parsed = new URL(url);
    const isConfiguredLocalhost = parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';
    const isRuntimeLocalhost =
      typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

    // 1. 本番ホストで localhost が埋め込まれている場合は無視する
    if (isConfiguredLocalhost && !isRuntimeLocalhost) {
      return '';
    }

    // 2. ローカル実行中（localhost/127.0.0.1）かつ
    // 設定されたURLが別ホスト（本番環境など）の場合は、
    // ローカルの Worker にプロキシされることを期待して相対パス（空文字）を返す。
    if (isRuntimeLocalhost && !isConfiguredLocalhost) {
      return '';
    }

    return url.replace(/\/+$/, '');
  } catch {
    return '';
  }
};
