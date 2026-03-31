import { DndContext } from '@dnd-kit/core';

import { useBoardLogic } from '../../hooks/useDragOnBoard';
import { BoardBackground } from './BoardBackground';
import { StickyNote } from '../sticky-note/StickyNote';
import { useDropOnBoard } from '../../hooks/useDropMdFile';

export function Board() {
  const { handleDrop } = useDropOnBoard();
  const { notes, handleDragEnd } = useBoardLogic(); // D&Dロジックを分離

  return (
    <div
      onDragOver={(e) => e.preventDefault()} // ドロップを許可するために必要
      onDrop={handleDrop}
      className="h-screen w-screen relative overflow-hidden">
      <BoardBackground type="4-quadrant" /> {/* グリッドを抽象化 */}
      <DndContext onDragEnd={handleDragEnd}>
        {notes.map(note => <StickyNote key={note.id} {...note} />)}
      </DndContext>
    </div>
  );
}