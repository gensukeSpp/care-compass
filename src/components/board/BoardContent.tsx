import { DndContext } from '@dnd-kit/core';
import { useBoardDnd } from '../../hooks/useBoardDnd';
import { AddNoteForm } from '../../components/common/AddNoteForm';
import { NoteModalTop } from '../../components/note-modal/NoteModal';
import { BoardReference } from './BoardReference';
import { PendingDrawer } from '../../components/pending/PendingDrawer';

export function BoardContent() {
  const { sensors, handleDragStart, handleDragEnd, activeOverlay, boardRef } = useBoardDnd();
  // 4. プロファイルが選択されている場合
  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="relative min-h-screen overflow-hidden bg-gray-50">
        <NoteModalTop />
        <AddNoteForm />
        <BoardReference ref={boardRef} />
        <PendingDrawer />
        {activeOverlay()}
      </div>
    </DndContext>
  );
}