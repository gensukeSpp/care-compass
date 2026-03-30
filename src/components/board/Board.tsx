import { DndContext } from '@dnd-kit/core';

import { useBoardLogic } from '../../hooks/useDragOnBoard';
import { BoardBackground } from './BoardBackground';
import { StickyNote } from '../sticky-note/StickyNote';

export function Board() {
  const { notes, handleDragEnd } = useBoardLogic(); // D&Dロジックを分離

  return (
    <div className="h-screen w-screen relative overflow-hidden">
      <BoardBackground type="4-quadrant" /> {/* グリッドを抽象化 */}
      <DndContext onDragEnd={handleDragEnd}>
        {notes.map(note => <StickyNote key={note.id} {...note} />)}
      </DndContext>
    </div>
  );
}