import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import type { Profile } from '../../types/index';
import { useNavigate } from 'react-router-dom';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  profile: Profile;
}

export function BoardSettingsModal({ isOpen, onClose, profile }: Props) {
  const updateProfileLabels = useAuthStore((s) => s.updateProfileLabels);
  const deleteProfile = useAuthStore((s) => s.deleteProfile);
  const checkAuth = useAuthStore((s) => s.checkAuth);
  const roles = useAuthStore((s) => s.currentRoles);
  const navigate = useNavigate();

  const [name, setName] = useState(profile.name || '');
  const [canLabel, setCanLabel] = useState(profile.can_label || 'できる');
  const [cannotLabel, setCannotLabel] = useState(profile.cannot_label || 'できない');
  const [riskLabel, setRiskLabel] = useState(profile.risk_label || '危険を伴う');
  const [requestLabel, setRequestLabel] = useState(profile.request_label || '頼みたい');
  const [isSaving, setIsSaving] = useState(false);

  const isOwner = roles && profile && profile.id ? roles[profile.id] === 'owner' : false;

  useEffect(() => {
    setName(profile.name || '');
    setCanLabel(profile.can_label || 'できる');
    setCannotLabel(profile.cannot_label || 'できない');
    setRiskLabel(profile.risk_label || '危険を伴う');
    setRequestLabel(profile.request_label || '頼みたい');
  }, [profile]);

  if (!isOpen) return null;

  const handleReset = () => {
    setCanLabel('できる');
    setCannotLabel('できない');
    setRiskLabel('危険を伴う');
    setRequestLabel('頼みたい');
  };

  const handleSave = async () => {
    if (!profile || !profile.id) return;
    setIsSaving(true);
    try {
      // 名前が変更されている場合は profiles テーブルを更新
      if (name.trim() !== (profile.name || '').trim()) {
        const { error } = await supabase.from('profiles').update({ name: name.trim() }).eq('id', profile.id);
        if (error) throw error;
      }

      // ラベル更新は RPC を通す
      await updateProfileLabels(profile.id, {
        can: canLabel.trim() || 'できる',
        cannot: cannotLabel.trim() || 'できない',
        risk: riskLabel.trim() || '危険を伴う',
        request: requestLabel.trim() || '頼みたい',
      });

      // 一覧をリロードして最新のプロファイル情報を取得
      await checkAuth();

      onClose();
    } catch (err) {
      console.error('Failed to save profile settings', err);
      alert(err instanceof Error ? err.message : '保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!profile || !profile.id) return;
    const ok = window.confirm('このボードと関連データを完全に削除します。よろしいですか？（元に戻せません）');
    if (!ok) return;

    setIsSaving(true);
    try {
      await deleteProfile(profile.id);

      // プロファイル一覧を再取得してフロントを更新（必要なら）
      await checkAuth();

      // 削除後はダッシュボードへ遷移
      navigate('/dashboard');
      onClose();
    } catch (err) {
      console.error('Failed to delete profile', err);
      alert(err instanceof Error ? err.message : '削除に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-lg w-[min(720px,95%)] p-6 z-70">
        <h3 className="text-lg font-semibold mb-4">ボード設定</h3>

        <div className="space-y-3">
          <label className="block">
            <div className="text-sm text-gray-600">プロフィール名</div>
            <input className="mt-1 w-full border rounded px-2 py-1" value={name} onChange={(e) => setName(e.target.value)} />
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block">
              <div className="text-sm text-gray-600">できるラベル</div>
              <input className="mt-1 w-full border rounded px-2 py-1" value={canLabel} onChange={(e) => setCanLabel(e.target.value)} />
            </label>

            <label className="block">
              <div className="text-sm text-gray-600">できないラベル</div>
              <input className="mt-1 w-full border rounded px-2 py-1" value={cannotLabel} onChange={(e) => setCannotLabel(e.target.value)} />
            </label>

            <label className="block">
              <div className="text-sm text-gray-600">リスクラベル</div>
              <input className="mt-1 w-full border rounded px-2 py-1" value={riskLabel} onChange={(e) => setRiskLabel(e.target.value)} />
            </label>

            <label className="block">
              <div className="text-sm text-gray-600">頼みたいラベル</div>
              <input className="mt-1 w-full border rounded px-2 py-1" value={requestLabel} onChange={(e) => setRequestLabel(e.target.value)} />
            </label>
          </div>
        </div>

        <div className="mt-6 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {isOwner ? 'オーナーとしてボードの設定を編集できます。' : 'このボードの設定を編集する権限がありません。'}
          </div>

          <div className="flex justify-end gap-2">
            <button type="button" className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200" onClick={handleReset} disabled={isSaving}>デフォルトに戻す</button>
            <button type="button" className="px-3 py-1 rounded bg-white border" onClick={onClose} disabled={isSaving}>キャンセル</button>
            {isOwner && (
              <button type="button" className="px-3 py-1 rounded bg-red-600 text-white mr-2" onClick={handleDelete} disabled={isSaving}>{isSaving ? '削除中...' : 'ボードを削除'}</button>
            )}
            <button type="button" className="px-4 py-1 rounded bg-indigo-600 text-white" onClick={handleSave} disabled={isSaving}>{isSaving ? '保存中...' : '保存'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
