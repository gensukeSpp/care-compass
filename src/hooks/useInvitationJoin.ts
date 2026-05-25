import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';

export type JoinStatus = 'idle' | 'processing' | 'success' | 'error';

export const useInvitationJoin = (
  token: string | null,
  opts?: { onAutoNavigate?: (profileId: string) => void; autoNavigateDelayMs?: number }
) => {
  const [status, setStatus] = useState<JoinStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);

  const acceptInvitation = useAuthStore((s) => s.acceptInvitation);

  const delay = opts?.autoNavigateDelayMs ?? 3000;

  const join = useCallback(async () => {
    if (!token) {
      setStatus('error');
      setErrorMessage('無効な招待リンクです。');
      return;
    }

    setStatus('processing');
    try {
      const id = await acceptInvitation(token);
      setProfileId(id);
      setStatus('success');

      if (opts?.onAutoNavigate) {
        if (timerRef.current) window.clearTimeout(timerRef.current);
        timerRef.current = window.setTimeout(() => {
          opts.onAutoNavigate?.(id);
        }, delay) as unknown as number;
      }
    } catch (err) {
      console.error('useInvitationJoin: acceptInvitation failed', err);
      setStatus('error');
      setErrorMessage(err instanceof Error ? err.message : (err as any)?.message || String(err) || '招待の受諾に失敗しました。');
    }
  }, [token, acceptInvitation, opts?.onAutoNavigate, delay]);

  const cancelAutoNavigate = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      cancelAutoNavigate();
    };
  }, [cancelAutoNavigate]);

  return { status, errorMessage, profileId, join, cancelAutoNavigate } as const;
};

export default useInvitationJoin;
