import { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import type { Profile } from '../../types/index';
import { useBoardSettings } from '../../hooks/useBoardSettings';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  profile: Profile;
}

export function BoardSettingsModal({ isOpen, onClose, profile }: Props) {
  const roles = useAuthStore((s) => s.currentRoles);

  const [name, setName] = useState(profile.name || '');
  const [canLabel, setCanLabel] = useState(profile.can_label || 'できる');
  const [cannotLabel, setCannotLabel] = useState(profile.cannot_label || 'できない');
  const [riskLabel, setRiskLabel] = useState(profile.risk_label || '危険を伴う');
  const [requestLabel, setRequestLabel] = useState(profile.request_label || '頼みたい');

  const { isSaving, save, remove } = useBoardSettings(profile, onClose);

  const isOwner = roles && profile && profile.id ? roles[profile.id] === 'owner' : false;

  useEffect(() => {
    if (isOpen) {
      setName(profile.name || '');
      setCanLabel(profile.can_label || 'できる');
      setCannotLabel(profile.cannot_label || 'できない');
      setRiskLabel(profile.risk_label || '危険を伴う');
      setRequestLabel(profile.request_label || '頼みたい');
    }
  }, [profile.id, isOpen]);

  if (!isOpen) return null;

  const handleReset = () => {
    setCanLabel('できる');
    setCannotLabel('できない');
    setRiskLabel('危険を伴う');
    setRequestLabel('頼みたい');
  };

  const handleSave = () => {
    // profileオブジェクトのプロパティを状態変数の値で更新
    const updatedProfile = {
      ...profile,
      name,
      can_label: canLabel,
      cannot_label: cannotLabel,
      risk_label: riskLabel,
      request_label: requestLabel
    };
    save(updatedProfile);
  };

  const handleDelete = () => remove(profile.id);

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-lg w-[min(720px,95%)] p-6 z-70">
        <h3 className="text-lg font-semibold mb-4">ボード設定</h3>

        <div className="space-y-3">
          <label className="block">
            <div className="text-sm text-gray-600">プロフィール名</div>
            <input
              className="mt-1 w-full border rounded px-2 py-1"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!isOwner || isSaving}
            />
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block">
              <div className="text-sm text-gray-600">できるラベル</div>
              <input
                className="mt-1 w-full border rounded px-2 py-1"
                value={canLabel}
                onChange={(e) => setCanLabel(e.target.value)}
                disabled={!isOwner || isSaving}
              />
            </label>

            <label className="block">
              <div className="text-sm text-gray-600">できないラベル</div>
              <input
                className="mt-1 w-full border rounded px-2 py-1"
                value={cannotLabel}
                onChange={(e) => setCannotLabel(e.target.value)}
                disabled={!isOwner || isSaving}
              />
            </label>

            <label className="block">
              <div className="text-sm text-gray-600">リスクラベル</div>
              <input
                className="mt-1 w-full border rounded px-2 py-1"
                value={riskLabel}
                onChange={(e) => setRiskLabel(e.target.value)}
                disabled={!isOwner || isSaving}
              />
            </label>

            <label className="block">
              <div className="text-sm text-gray-600">頼みたいラベル</div>
              <input
                className="mt-1 w-full border rounded px-2 py-1"
                value={requestLabel}
                onChange={(e) => setRequestLabel(e.target.value)}
                disabled={!isOwner || isSaving}
              />
            </label>
          </div>
        </div>

        <div className="mt-6 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {isOwner ? 'オーナーとしてボードの設定を編集できます。' : 'このボードの設定を編集する権限がありません。'}
          </div>

          <div className="flex justify-end gap-2">
            <button type="button" className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200" onClick={handleReset} disabled={!isOwner || isSaving}>デフォルトに戻す</button>
            <button type="button" className="px-3 py-1 rounded bg-white border" onClick={onClose} disabled={isSaving}>キャンセル</button>
            {isOwner && (
              <button type="button" className="px-3 py-1 rounded bg-red-600 text-white mr-2" onClick={handleDelete} disabled={isSaving}>{isSaving ? '削除中...' : 'ボードを削除'}</button>
            )}
            <button type="button" className="px-4 py-1 rounded bg-indigo-600 text-white" onClick={handleSave} disabled={!isOwner || isSaving}>{isSaving ? '保存中...' : '保存'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
