import { useStore } from '../store/useStore';
import { readMdFile } from '../utils/readMdFile';
import { splitMdByHeader } from '../utils/splitMdByHeader';

/**
 * ファイル（Markdown等）をドロップして保留ボックス（Pending Box）にインポートするためのカスタムフック
 */
export function useFileImport() {
  const { addPendingNotes } = useStore();

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    
    // .md または .txt ファイルを対象とする
    const targetFiles = files.filter(file => 
      file.name.endsWith('.md') || 
      file.name.endsWith('.txt') ||
      file.type === 'text/markdown' || 
      file.type === 'text/plain'
    );

    if (targetFiles.length === 0) return;

    const allNewNotes: { title: string; content: string; category: any }[] = [];

    for (const file of targetFiles) {
      try {
        const content = await readMdFile(file);
        // ファイル名をデフォルトタイトルとして、見出しで分割
        const defaultTitle = file.name.replace(/\.(md|txt)$/, '');
        const splitNotes = splitMdByHeader(content, defaultTitle);
        
        splitNotes.forEach(sn => {
          allNewNotes.push({
            title: sn.title,
            content: sn.content,
            category: 'other' // デフォルトカテゴリ
          });
        });
      } catch (error) {
        console.error(`Failed to read file: ${file.name}`, error);
      }
    }

    if (allNewNotes.length > 0) {
      addPendingNotes(allNewNotes);
    }
  };

  return { handleDrop };
}

// 互換性のための別名（必要に応じて）
export const useDropOnBoard = useFileImport;
