import { DndContext } from '@dnd-kit/core';
import { useBoardDnd } from '../../hooks/useBoardDnd';
import { useStore } from '../../store/useStore';
import { AddNoteForm } from '../../components/common/AddNoteForm';
import { BoardReference } from './BoardReference';
import { PendingDrawer } from '../../components/pending/PendingDrawer';

export function BoardContent() {
  const { sensors, handleDragStart, handleDragEnd, handleDragCancel, activeOverlay, boardRef } = useBoardDnd();
  const isPendingBoxOpen = useStore((state) => state.isPendingBoxOpen);

  // 4. プロファイルが選択されている場合
  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragCancel={handleDragCancel}>
      <div className={`relative h-full overflow-hidden bg-gray-50 transition-all duration-300 ${isPendingBoxOpen ? 'mr-[320px]' : 'mr-0'}`}>
        <AddNoteForm />
        <BoardReference ref={boardRef} />
        <PendingDrawer />
        {activeOverlay()}
      </div>
    </DndContext>
  );
}