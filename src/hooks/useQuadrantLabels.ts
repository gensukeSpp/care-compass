import { useCallback } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import type { QuadrantId, Profile } from '../types/index';

/**
 * 現在選択されているプロファイルの象限ラベルを取得するカスタムフック。
 * ラベルが設定されていない場合はデフォルト値を返します。
 * 
 * @return :{ can: string; cannot: string; risk: string; request: string; getLabel: (id: QuadrantId) => string } 象限ラベルのオブジェクトと変換関数
 */
export const useQuadrantLabels = () => {
  const { currentProfileId, currentProfiles } = useAuthStore();
  const profile = currentProfiles.find((p: Profile) => p.id === currentProfileId);

  const labels = {
    can: profile?.can_label || 'できる',
    cannot: profile?.cannot_label || 'できない',
    risk: profile?.risk_label || '危険を伴う',
    request: profile?.request_label || '頼みたい',
  };

  const getLabel = useCallback((id: QuadrantId): string => {
    switch (id) {
      case 'can': return labels.can;
      case 'cannot': return labels.cannot;
      case 'risk': return labels.risk;
      case 'request': return labels.request;
      case 'pending': return '保留';
      default: return id;
    }
  }, [labels]);

  return { ...labels, getLabel };
};

