import { useDraggable } from '@dnd-kit/core';
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
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: note.id,
    data: {
      type: 'pending-note',
      note
    }
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: 100,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`p-3 mb-2 bg-white border rounded shadow-sm cursor-grab active:cursor-grabbing hover:border-blue-400 transition-colors ${
        isDragging ? 'opacity-50' : ''
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
