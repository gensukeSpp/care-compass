import { useDraggable } from '@dnd-kit/core';
import { type Note } from '../../types';
import { StickyNoteView } from '../sticky-note/StickyNoteView';

interface PendingNoteItemProps {
  note: Note;
  onSelect: (id: string) => void;
}

export const PendingNoteItem = ({ note, onSelect }: PendingNoteItemProps) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: note.id,
    data: {
      type: 'pending-note',
      note
    }
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`mb-2 cursor-grab active:cursor-grabbing ${isDragging ? 'opacity-0' : ''}`}
      onClick={() => onSelect(note.id)}
    >
      <StickyNoteView
        title={note.title}
        category={note.category}
        isDragging={isDragging}
      />
    </div>
  );
};
