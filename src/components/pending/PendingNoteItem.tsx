import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { type Note } from '../../types';

const categoryEmojis: Record<string, string> = {
  house: '🏠',
  food: '🍱',
  health: '💪',
  medical: '💊',
  social: '🧑‍🤝‍🧑',
};

interface PendingNoteItemProps {
  note: Note;
  onSelect: (id: string) => void;
}

export const PendingNoteItem = ({ note, onSelect }: PendingNoteItemProps) => {
  const { attributes, listeners, setNodeRef, isDragging, transform } = useDraggable({
    id: note.id,
    data: {
      type: 'pending-note',
      note
    }
  });

  const style = {
    transform: isDragging ? undefined : CSS.Translate.toString(transform),
    touchAction: 'none' as const,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`p-3 mb-2 bg-white border rounded shadow-sm cursor-grab active:cursor-grabbing hover:border-blue-400 transition-colors ${
        isDragging ? 'opacity-0' : ''
      }`}
      onClick={() => onSelect(note.id)}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">{categoryEmojis[note.category] || '🗒️'}</span>
        <h4 className="font-bold text-sm truncate">{note.title}</h4>
      </div>
      <p className="text-xs text-gray-500 line-clamp-2">{note.content}</p>
    </div>
  );
};
