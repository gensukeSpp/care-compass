import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle2, AlertCircle, ArrowRight, LogIn } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import useInvitationJoin from '../hooks/useInvitationJoin';

/**
 * Small presentational components for each view state
 */
const JoinInvalidUrlView: React.FC<{ onBack: () => void }> = ({ onBack }) => (
  <div className="min-h-[calc(100vh-64px)] bg-gray-50 flex items-center justify-center p-6">
    <div className="bg-white p-10 rounded-3xl shadow-sm border border-gray-100 max-w-md w-full text-center">
      <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
      <h2 className="text-2xl font-bold text-gray-800 mb-4">無効なURLです</h2>
      <p className="text-gray-600 mb-8">正しい招待リンクを使用してください。</p>
      <button
        onClick={onBack}
        className="w-full py-3 px-6 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors"
      >
        ダッシュボードへ戻る
      </button>
    </div>
  </div>
);

const JoinLoginView: React.FC<{ onLogin: () => void }> = ({ onLogin }) => (
  <div>
    <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-8">
      <LogIn className="w-10 h-10 text-indigo-600" />
    </div>
    <h2 className="text-2xl font-bold text-gray-800 mb-4">ボードに招待されました</h2>
    <p className="text-gray-600 mb-8">参加するにはログインが必要です。</p>
    <button
      onClick={onLogin}
      className="w-full py-4 px-6 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-3 shadow-lg shadow-indigo-100"
    >
      Googleでログインして参加
      <ArrowRight className="w-5 h-5" />
    </button>
  </div>
);

const JoinProcessingView: React.FC = () => (
  <div className="py-10">
    <Loader2 className="w-16 h-16 text-indigo-600 animate-spin mx-auto mb-6" />
    <h2 className="text-2xl font-bold text-gray-800 mb-4">参加処理中...</h2>
    <p className="text-gray-600">ボードの権限を確認しています。少々お待ちください。</p>
  </div>
);

const JoinSuccessView: React.FC<{ onImmediate: () => void }> = ({ onImmediate }) => (
  <div className="py-6">
    <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-6 animate-in bounce-in duration-500" />
    <h2 className="text-2xl font-bold text-gray-800 mb-4">参加が完了しました！</h2>
    <p className="text-gray-600 mb-8">家族のボードへようこそ。<br />3秒後に自動的に移動します。</p>
    <button
      onClick={onImmediate}
      className="w-full py-3 px-6 bg-indigo-50 text-indigo-700 rounded-xl font-bold hover:bg-indigo-100 transition-colors flex items-center justify-center gap-2"
    >
      今すぐボードを表示する
      <ArrowRight className="w-5 h-5" />
    </button>
  </div>
);

const JoinErrorView: React.FC<{ message: string | null; onBack: () => void }> = ({ message, onBack }) => (
  <div className="py-6">
    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
    <h2 className="text-2xl font-bold text-gray-800 mb-4">参加できませんでした</h2>
    <p className="text-gray-600 mb-8">{message}</p>
    <button
      onClick={onBack}
      className="w-full py-3 px-6 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors"
    >
      ダッシュボードへ戻る
    </button>
  </div>
);

/**
 * Container component: only responsible for wiring token and switching views
 */
export const JoinPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const login = useAuthStore((state) => state.login);
  const selectProfile = useAuthStore((state) => state.selectProfile);

  const onAutoNavigate = (id: string) => {
    selectProfile(id);
    navigate('/');
  };

  const { status, errorMessage, profileId, join } = useInvitationJoin(token, { onAutoNavigate });

  useEffect(() => {
    if (isLoggedIn && token && status === 'idle') {
      join();
    }
  }, [isLoggedIn, token, status, join]);

  if (!token) {
    return <JoinInvalidUrlView onBack={() => navigate('/dashboard')} />;
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white p-10 rounded-3xl shadow-sm border border-gray-100 max-w-md w-full text-center animate-in fade-in zoom-in duration-300">
        {status === 'idle' && !isLoggedIn && <JoinLoginView onLogin={() => login()} />}
        {status === 'processing' && <JoinProcessingView />}
        {status === 'success' && <JoinSuccessView onImmediate={() => { if (profileId) selectProfile(profileId); navigate('/'); }} />}
        {status === 'error' && <JoinErrorView message={errorMessage} onBack={() => navigate('/dashboard')} />}
      </div>
    </div>
  );
};

export default JoinPage;

