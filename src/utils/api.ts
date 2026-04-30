export const getApiBaseUrl = (): string => {
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
