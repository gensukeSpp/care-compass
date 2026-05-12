import { useEffect } from 'react';
import { useStore } from '../store/useStore';

// カスタムフック
export const useWebShareTarget = () => {
  useEffect(() => {
    // ... current share logic
    const urlParams = new URLSearchParams(window.location.search);
    const title = urlParams.get('title');
    const text = urlParams.get('text');
    const url = urlParams.get('url');

    if (title || text || url) {
      const { addPendingNote } = useStore.getState();
      const content = [text, url].filter(Boolean).join('\n\n');
      addPendingNote(title || 'Shared Note', content, 'house');

      // パラメータをクリアするために URL をクリーンアップ
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);
};