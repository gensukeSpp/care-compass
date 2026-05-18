import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';

// カスタムフック

export const useInvitation = (profileId: string) => {
  const [invitationUrl, setInvitationUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const user = useAuthStore((state) => state.currentUser);

  /**
   * Supabaseで招待トークンを発行し、招待URLを生成します。
   * @return :Promise<void> 戻り値はありません
   */
  const generateInvite = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (!user) {
        throw new Error('招待リンクを発行するにはログインが必要です。');
      }
      // 24時間後に期限切れ
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      // 招待リンク生成のビジネスロジックとAPI呼び出しをここに集約
      const { data, error: insertError } = await supabase
        .from('invitations')
        .insert({
          profile_id: profileId,
          expires_at: expiresAt,
          created_by: user.id,
        })
        .select('token')
        .single();

      if (insertError) throw insertError;

      const url = `${window.location.origin}/join?token=${data.token}`;
      setInvitationUrl(url);
    } catch (err) {
      setError('招待リンクの生成に失敗しました。');
    } finally {
      setIsLoading(false);
    }
  };

  return { invitationUrl, isLoading, error, generateInvite };
};