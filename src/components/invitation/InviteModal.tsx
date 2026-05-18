import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Check, X, Share2, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  profileId: string;
  profileName: string;
}

/**
 * 家族を招待するためのモーダルコンポーネントです。招待リンクの生成、QRコード表示、共有機能を提供します。
 * @params
 *  props :InviteModalProps - モーダルの表示状態や対象プロファイル情報
 * @return :React.FC 招待モーダルコンポーネント
 */
export const InviteModal: React.FC<InviteModalProps> = ({ isOpen, onClose, profileId, profileName }) => {
  const [invitationUrl, setInvitationUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Supabaseで招待トークンを発行し、招待URLを生成します。
   * @return :Promise<void> 戻り値はありません
   */
  const generateInvite = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const user = useAuthStore.getState().currentUser;
      if (!user) {
        throw new Error('招待リンクを発行するにはログインが必要です。');
      }

      // 24時間後に期限切れ
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      
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
      console.error('Failed to generate invite:', err);
      setError('招待リンクの生成に失敗しました。');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 招待URLをクリップボードにコピーします。
   * @return :Promise<void> 戻り値はありません
   */
  const copyToClipboard = async () => {
    if (!invitationUrl) return;
    try {
      await navigator.clipboard.writeText(invitationUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  /**
   * OS標準の共有機能（Web Share API）を使用して招待リンクを共有します。
   * 未対応の場合はクリップボードへのコピーを実行します。
   * @return :Promise<void> 戻り値はありません
   */
  const handleShare = async () => {
    if (!invitationUrl) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Care Compass - ${profileName}さんのボードに招待`,
          text: `${profileName}さんのケア・コンパスボードに参加するための招待リンクです。`,
          url: invitationUrl,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      copyToClipboard();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-800">家族を招待する</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-8">
          {!invitationUrl ? (
            <div className="text-center py-4">
              <p className="text-gray-600 mb-6">
                {profileName}さんのボードに参加するための招待リンクを発行します。<br />
                リンクを知っている人は誰でも参加できます。
              </p>
              <button
                onClick={generateInvite}
                disabled={isLoading}
                className="w-full py-3 px-6 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:bg-indigo-300 transition-colors flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    生成中...
                  </>
                ) : (
                  <>
                    <Share2 className="w-5 h-5" />
                    招待リンクを発行する
                  </>
                )}
              </button>
              {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
            </div>
          ) : (
            <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-300">
              <div className="flex flex-col items-center gap-4">
                <div className="p-4 bg-white border-4 border-indigo-50 rounded-2xl shadow-sm">
                  <QRCodeSVG value={invitationUrl} size={180} />
                </div>
                <p className="text-sm text-gray-500">このQRコードをスマホでスキャン</p>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-700">招待リンク</p>
                <div className="flex gap-2">
                  <input
                    readOnly
                    value={invitationUrl}
                    className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none"
                  />
                  <button
                    onClick={copyToClipboard}
                    className={`p-2 rounded-lg transition-colors border ${
                      copied 
                        ? 'bg-green-50 border-green-200 text-green-600' 
                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  </button>
                </div>
                <button
                  onClick={handleShare}
                  className="w-full py-3 px-6 bg-indigo-50 text-indigo-700 rounded-xl font-bold hover:bg-indigo-100 transition-colors flex items-center justify-center gap-2"
                >
                  <Share2 className="w-5 h-5" />
                  リンクを共有する
                </button>
              </div>

              <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                <p className="text-xs text-amber-800 leading-relaxed">
                  ※ 招待リンクの有効期限は24時間です。<br />
                  ※ 誰かがリンクを使って参加すると、その方は「メンバー」としてボードを閲覧・編集できるようになります。
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
