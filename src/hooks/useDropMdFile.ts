import { useStore } from '../store/useStore';
import { readMdFile } from '../utils/readMdFile';

export function useDropOnBoard() {
  const { setDraftContent, openAddForm } = useStore();

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.md') || file.type === 'text/markdown')) {
      const content = await readMdFile(file);
      // 読み込んだ内容を「下書き」として保持し、フォームを開く
      setDraftContent(content);
      openAddForm();
    }
  };
  return { handleDrop };
}