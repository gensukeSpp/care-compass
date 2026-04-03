import { X } from 'lucide-react';
import type { Category } from '../../types';

interface NoteHeaderProps {
  isEditing: boolean;
  editTitle: string;
  onTitleChange: (title: string) => void;
  categoryLabel: Category;
  noteTitle: string;
  isPending: boolean;
  selectNote: (noteId: string | null) => void;
}

export const NoteHeader = ({ isEditing, editTitle, onTitleChange, categoryLabel, noteTitle, isPending, selectNote }: NoteHeaderProps) => {

  return (
    <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
      <div className="flex-1">
        {isEditing ? (
          <input
            className="w-full font-bold text-xl border-b-2 border-blue-500 outline-none bg-transparent py-1"
            value={editTitle}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="タイトルを入力..."
            autoFocus
          />
        ) : (
          <div className="flex items-center gap-3">
            <span className="text-2xl">{categoryLabel}</span>
            <h2 className="font-bold text-xl text-gray-800">{noteTitle}</h2>
            {isPending && (
              <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded-full font-semibold">
                保留中
              </span>
            )}
          </div>
        )}
      </div>
      <button
        onClick={() => selectNote(null)}
        className="ml-4 text-gray-400 hover:text-gray-600 transition-colors p-1"
      >
        <X width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></X>
      </button>
    </div>
  );
}

