import { LogIn } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

interface WelcomeViewProps {
  isLoggedIn: boolean;
}

export function WelcomeView({ isLoggedIn }: WelcomeViewProps) {
  const login = useAuthStore((state) => state.login);

  // 1. ログインしていない場合
  if (!isLoggedIn) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] bg-gray-50 p-6">
        <div className="bg-white p-10 rounded-3xl shadow-xl shadow-gray-200 text-center max-w-lg border border-gray-100">
          <div className="w-20 h-20 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-6 text-indigo-600">
            <LogIn className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">ケア・コンパスへようこそ</h2>
          <p className="text-gray-600 mb-8 leading-relaxed">
            大切な方の自立と安全を可視化し、家族でサポートを共有するための4象限ボードです。
            まずはログインしてボードを作成しましょう。
          </p>
          <button
            onClick={login}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-200 transition-all text-lg"
          >
            Googleでログイン
          </button>
        </div>
      </div>
    );
  }
}