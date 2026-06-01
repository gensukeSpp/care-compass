import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import type { Profile } from '../types/index';

export function useBoardSettings(profile: Profile, onClose: () => void) {
  const [isSaving, setIsSaving] = useState(false);
  const updateProfileLabels = useAuthStore((s) => s.updateProfileLabels);
  const deleteProfile = useAuthStore((s) => s.deleteProfile);
  // const checkAuth = useAuthStore((s) => s.checkAuth);
  const navigate = useNavigate();

  const save = async (updatedProfile?: Profile) => {
    if (!profile || !profile.id) return;
    const profileToSave = updatedProfile || profile;
    const trimmedName = profileToSave.name.trim();
    if (!trimmedName) {
      alert('プロフィール名を入力してください。');
      return;
    }
    setIsSaving(true);
    try {
      // 名前が変更されている場合は profiles テーブルを更新
      if (trimmedName !== (profileToSave.name || '').trim()) {
        const { error } = await supabase.from('profiles').update({ name: trimmedName }).eq('id', profileToSave.id);
        if (error) throw error;
      }

      // ラベル更新は RPC を通す
      await updateProfileLabels(profileToSave.id, {
        can: profileToSave.can_label.trim() || 'できる',
        cannot: profileToSave.cannot_label.trim() || 'できない',
        risk: profileToSave.risk_label.trim() || '危険を伴う',
        request: profileToSave.request_label.trim() || '頼みたい',
      });

      // 一覧をリロードして最新のプロファイル情報を取得
      // 全プロファイル情報を再取得するのは冗長
      // await checkAuth();

      onClose();
    } catch (err) {
      console.error('Failed to save profile settings', err);
      alert(err instanceof Error ? err.message : '保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  const remove = async (profile_id: string) => {
    if (!profile || !profile.id) return;
    const ok = window.confirm('このボードと関連データを完全に削除します。よろしいですか？（元に戻せません）');
    if (!ok) return;

    setIsSaving(true);
    try {
      await deleteProfile(profile.id);

      // プロファイル一覧を再取得してフロントを更新（必要なら）
      // await checkAuth();

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
  return { isSaving, save, remove };
}
