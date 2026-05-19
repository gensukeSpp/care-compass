import React, { useEffect, useState, useCallback, use } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { Loader2, CheckCircle2, AlertCircle, ArrowRight, LogIn } from 'lucide-react';

/**
 * 招待リンクからボードに参加するためのページコンポーネントです。
 * @return :React.FC 招待参加ページコンポーネント
 */
export const JoinPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const login = useAuthStore((state) => state.login);
  const acceptInvitation = useAuthStore((state) => state.acceptInvitation);
  const selectProfile = useAuthStore((state) => state.selectProfile);

  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  /**
   * 招待トークンを検証し、ボードへの参加処理を実行します。
   * @return :Promise<void> 戻り値はありません
   */
  const handleJoin = useCallback(async () => {
    if (!token) {
      setStatus('error');
      setErrorMessage('無効な招待リンクです。');
      return;
    }

    setStatus('processing');
    try {
      const profileId = await acceptInvitation(token);
      setStatus('success');
      // 3秒後に自動遷移
      setTimeout(() => {
        selectProfile(profileId);
        navigate('/');
      }, 3000);
    } catch (err) {
      console.error('Failed to accept invitation:', err);
      setStatus('error');
      setErrorMessage(err instanceof Error ? err.message : '招待の受諾に失敗しました。リンクが無効か、有効期限が切れている可能性があります。');
    }
    // }, [token]);
  }, [token, acceptInvitation, selectProfile, navigate]);

  // TODO: 一度リリースして動作確認したいので、以下の対応を一時見送り
  // PR URL: https://github.com/gensukeSpp/care-compass/pull/60
  // useEffect(() => {
  //   const f = async () => {
  //     try {
  //       if (!token) return;
  //       const profileId = await acceptInvitation(token);
  //       setStatus('success');
  //       // 3秒後に自動遷移
  //       const timer = setTimeout(() => {
  //         selectProfile(profileId);
  //         navigate('/');
  //       }, 3000);
  //
  //       return () => clearTimeout(timer);
  //     } catch (err) {
  //       console.error('Failed to accept invitation:', err);
  //       setStatus('error');
  //       setErrorMessage(err instanceof Error ? err.message : '招待の受諾に失敗しました。リンクが無効か、有効期限が切れている可能性があります。');
  //     }
  //   };
  //   f();
  // }, [token, acceptInvitation, selectProfile, navigate]);

  useEffect(() => {
    if (isLoggedIn && token && status === 'idle') {
      handleJoin();
    }
  }, [isLoggedIn, token, status, handleJoin]);

  if (!token) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white p-10 rounded-3xl shadow-sm border border-gray-100 max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-800 mb-4">無効なURLです</h2>
          <p className="text-gray-600 mb-8">正しい招待リンクを使用してください。</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full py-3 px-6 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors"
          >
            ダッシュボードへ戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white p-10 rounded-3xl shadow-sm border border-gray-100 max-w-md w-full text-center animate-in fade-in zoom-in duration-300">
        {status === 'idle' && !isLoggedIn && (
          <>
            <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-8">
              <LogIn className="w-10 h-10 text-indigo-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">ボードに招待されました</h2>
            <p className="text-gray-600 mb-8">参加するにはログインが必要です。</p>
            <button
              onClick={() => login()}
              className="w-full py-4 px-6 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-3 shadow-lg shadow-indigo-100"
            >
              Googleでログインして参加
              <ArrowRight className="w-5 h-5" />
            </button>
          </>
        )}

        {status === 'processing' && (
          <div className="py-10">
            <Loader2 className="w-16 h-16 text-indigo-600 animate-spin mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-gray-800 mb-4">参加処理中...</h2>
            <p className="text-gray-600">ボードの権限を確認しています。少々お待ちください。</p>
          </div>
        )}

        {status === 'success' && (
          <div className="py-6">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-6 animate-in bounce-in duration-500" />
            <h2 className="text-2xl font-bold text-gray-800 mb-4">参加が完了しました！</h2>
            <p className="text-gray-600 mb-8">家族のボードへようこそ。<br />3秒後に自動的に移動します。</p>
            <button
              onClick={() => navigate('/')}
              className="w-full py-3 px-6 bg-indigo-50 text-indigo-700 rounded-xl font-bold hover:bg-indigo-100 transition-colors flex items-center justify-center gap-2"
            >
              今すぐボードを表示する
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="py-6">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-gray-800 mb-4">参加できませんでした</h2>
            <p className="text-gray-600 mb-8">{errorMessage}</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full py-3 px-6 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors"
            >
              ダッシュボードへ戻る
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default JoinPage;
