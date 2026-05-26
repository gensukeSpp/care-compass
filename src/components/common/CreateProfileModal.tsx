import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { X, UserPlus } from 'lucide-react';
import { useCreateProfile } from '../../hooks/useCreateProfile';

interface CreateProfileModalProps {
  onClose?: () => void;
}

export const CreateProfileModal: React.FC<CreateProfileModalProps> = ({ onClose }) => {
  const navigate = useNavigate();
  const { name, setName, labels, setLabels, submit, error, isLoading } = useCreateProfile(() => onClose);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      // if (onClose) onClose();
      submit();
      navigate('/');
    } catch (err) {
      console.error('Failed to create profile:', err);
    }
  };

  const handleLabelChange = (key: keyof typeof labels, value: string) => {
    setLabels(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-indigo-50">
          <div className="flex items-center gap-2">
            <UserPlus className="w-6 h-6 text-indigo-600" />
            <h2 className="text-xl font-bold text-gray-800">新しいボードを作成</h2>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/50 rounded-full transition-colors text-gray-500"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="profileName" className="block text-sm font-medium text-gray-700 mb-1">
              対象者の名前（例：父、祖母）
            </label>
            <input
              id="profileName"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="お名前を入力してください"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              autoFocus
              required
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              象限のラベル（必要に応じて変更してください）
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-blue-600 ml-1">左上</span>
                <input
                  type="text"
                  value={labels.can}
                  onChange={(e) => handleLabelChange('can', e.target.value)}
                  placeholder="できる"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm maxLength={15}"
                />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-orange-600 ml-1">右上</span>
                <input
                  type="text"
                  value={labels.cannot}
                  onChange={(e) => handleLabelChange('cannot', e.target.value)}
                  placeholder="できない"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none text-sm maxLength={15}"
                />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-red-600 ml-1">左下</span>
                <input
                  type="text"
                  value={labels.risk}
                  onChange={(e) => handleLabelChange('risk', e.target.value)}
                  placeholder="危険を伴う"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-red-500 outline-none text-sm maxLength={15}"
                />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-purple-600 ml-1">右下</span>
                <input
                  type="text"
                  value={labels.request}
                  onChange={(e) => handleLabelChange('request', e.target.value)}
                  placeholder="頼みたい"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-purple-500 outline-none text-sm maxLength={15}"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
              {error}
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading || !name.trim()}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'ボードを開始する'
              )}
            </button>
          </div>

          <p className="text-center text-xs text-gray-500 px-4">
            ボードを作成すると、あなたがオーナーとして登録されます。
            後から他の家族を招待することも可能です。
          </p>
        </form>
      </div>
    </div>
  );
};
