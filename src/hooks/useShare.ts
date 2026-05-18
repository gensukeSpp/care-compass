import { useState } from 'react';

export const useShare = () => {
  const [copied, setCopied] = useState(false);

  /**
   * 招待URLをクリップボードにコピーします。
   * @return :Promise<void> 戻り値はありません
   */
  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  /**
   * OS標準の共有機能（Web Share API）を使用して招待リンクを共有します。
   * 未対応の場合はクリップボードへのコピーを実行します。
   * @return :Promise<void> 戻り値はありません
   */
  const share = async (data: ShareData) => {
    if (navigator.share) {
      await navigator.share(data);
    } else {
      await copyToClipboard(data.url || '');
    }
  };

  return { copied, copyToClipboard, share };
};