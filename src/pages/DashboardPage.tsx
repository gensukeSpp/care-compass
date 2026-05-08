import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { CreateProfileModal } from '../components/common/CreateProfileModal';
import { LayoutGrid, UserPlus, ArrowRight } from 'lucide-react';

/**
 * ユーザーがアクセス可能なボード（プロファイル）を一覧表示し、選択または新規作成を行うダッシュボード画面です。
 * @return :React.FC ダッシュボード画面コンポーネント
 */
export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const currentProfiles = useAuthStore((state) => state.currentProfiles);
  const selectProfile = useAuthStore((state) => state.selectProfile);
  const currentUser = useAuthStore((state) => state.currentUser);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSelect = (profileId: string) => {
    selectProfile(profileId);
    navigate('/');
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50 p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
        <header className="mb-10">
          <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <LayoutGrid className="w-8 h-8 text-indigo-600" />
            ダッシュボード
          </h2>
          <p className="text-gray-600 mt-2">
            {currentUser?.name}さんがアクセス可能なボードの一覧です。
          </p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* ボードカード一覧 */}
          {currentProfiles.map((profile) => (
            <button
              key={profile.id}
              onClick={() => handleSelect(profile.id)}
              className="group bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-indigo-100 hover:border-indigo-200 transition-all text-left flex flex-col justify-between min-h-[160px]"
            >
              <div>
                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <span className="text-xl font-bold">{profile.name.charAt(0)}</span>
                </div>
                <h3 className="text-xl font-bold text-gray-800 group-hover:text-indigo-600 transition-colors">
                  {profile.name}
                </h3>
              </div>
              <div className="flex items-center justify-between mt-4">
                <span className="text-sm text-gray-500">ボードを表示する</span>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
              </div>
            </button>
          ))}

          {/* 新規作成カード */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="group bg-indigo-50 p-6 rounded-3xl border-2 border-dashed border-indigo-200 hover:border-indigo-400 hover:bg-indigo-100 transition-all text-left flex flex-col justify-center items-center min-h-[160px] gap-3"
          >
            <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center text-indigo-600 shadow-sm group-hover:scale-110 transition-transform">
              <UserPlus className="w-7 h-7" />
            </div>
            <span className="text-lg font-bold text-indigo-700">新しいボードを作成</span>
          </button>
        </div>
      </div>

      {isModalOpen && (
        <CreateProfileModal onClose={() => setIsModalOpen(false)} />
      )}
    </div>
  );
};

export default DashboardPage;
