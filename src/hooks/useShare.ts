import { useState, useCallback } from 'react';

export const useShare = () => {
  const [copied, setCopied] = useState(false);

  /**
   * 招待URLをクリップボードにコピーします。
   * @return :Promise<void> 戻り値はありません
   */
  const copyToClipboard = useCallback(async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);


  /**
   * OS標準の共有機能（Web Share API）を使用して招待リンクを共有します。
   * 未対応の場合はクリップボードへのコピーを実行します。
   * @return :Promise<void> 戻り値はありません
   */
  const share = useCallback(async (data: ShareData) => {
    if (navigator.share) {
      await navigator.share(data);
    } else {
      if (data.url) await copyToClipboard(data.url);
    }
  }, [copyToClipboard]);

  return { copied, copyToClipboard, share };
};