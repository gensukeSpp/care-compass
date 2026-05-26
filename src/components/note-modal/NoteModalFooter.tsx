import { useStore } from "../../store/useStore";
import type { QuadrantId, Category, Note } from "../../types/index";
import { useNoteActions } from "../../hooks/useNoteAction";
import { useQuadrantLabels } from "../../hooks/useQuadrantLabels";

interface NoteFooterProps {
  note: Note;
  isEditing: boolean;
  setIsEditing: (isEditing: boolean) => void;
  isPending: boolean;
  editTitle: string;
  editContent: string;
  editCategory: Category;
}

export function NoteFooter({ note, isEditing, setIsEditing, isPending, editTitle, editContent, editCategory }: NoteFooterProps) {
  const { selectedNoteId, selectNote, updateNote, deleteNote } = useStore();
  const { addNoteToBoard } = useNoteActions(selectedNoteId!);
  const labels = useQuadrantLabels();

  const handleSave = () => {
    updateNote(note.id, {
      title: editTitle,
      content: editContent,
      category: editCategory,
    });
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (window.confirm('この付箋を削除してもよろしいですか？')) {
      deleteNote(note.id);
      selectNote(null);
    }
  };

  const handleAddToBoard = (quadrant: QuadrantId) => {
    addNoteToBoard(quadrant);
    selectNote(null);
  };

  return (
    <div className="px-6 py-4 border-t bg-gray-50 flex flex-wrap justify-between items-center gap-4">
      <button
        onClick={handleDelete}
        className="text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
      >
        削除する
      </button>

      <div className="flex gap-3 ml-auto">
        {isEditing ? (
          <>
            <button
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
            >
              キャンセル
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition-all font-semibold"
            >
              保存する
            </button>
          </>
        ) : (
          <>
            {isPending ? (
              <div className="flex gap-2 flex-wrap">
                <span className="text-xs text-gray-400 self-center mr-1">ボードに追加:</span>
                <button onClick={() => handleAddToBoard('can')} className="px-3 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200 transition-colors">{labels.can}</button>
                <button onClick={() => handleAddToBoard('cannot')} className="px-3 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200 transition-colors">{labels.cannot}</button>
                <button onClick={() => handleAddToBoard('risk')} className="px-3 py-1 bg-orange-100 text-orange-700 rounded text-xs hover:bg-orange-200 transition-colors">{labels.risk}</button>
                <button onClick={() => handleAddToBoard('request')} className="px-3 py-1 bg-purple-100 text-purple-700 rounded text-xs hover:bg-purple-200 transition-colors">{labels.request}</button>
              </div>
            ) : null}
            <button
              onClick={() => setIsEditing(true)}
              className="px-6 py-2 bg-gray-800 text-white rounded-lg shadow-md hover:bg-black transition-all font-semibold"
            >
              編集する
            </button>
            <button
              onClick={() => selectNote(null)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition-all font-semibold"
            >
              閉じる
            </button>
          </>
        )}
      </div>
    </div>
  );
}