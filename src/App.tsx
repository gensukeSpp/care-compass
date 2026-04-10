import { DndContext, useSensors, useSensor, MouseSensor, TouchSensor, DragOverlay } from '@dnd-kit/core';
import { AddNoteForm } from './components/common/AddNoteForm';
import { NoteModalTop } from './components/note-modal/NoteModal';
import { Board } from './components/board/Board';
import { PendingDrawer } from './components/pending/PendingDrawer';
import { useContainerResize } from './hooks/useContainerResize';
import { useBoardLogic } from './hooks/useDragOnBoard';
import { StickyNoteView } from './components/sticky-note/StickyNoteView';

function App() {
  const { handleDragStart, handleDragEnd, activeId, notes, pendingNotes } = useBoardLogic();
  useContainerResize();

  // センサーの設定: マウスとタッチでそれぞれ最適化
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  );

  // ドラッグ中のノート情報を取得
  const activeNote = notes.find(n => n.id === activeId) || pendingNotes.find(n => n.id === activeId);

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="relative min-h-screen overflow-hidden">
        <NoteModalTop />
        <AddNoteForm />
        <Board />
        <PendingDrawer />

        {/* ドラッグ中のプレビュー表示 */}
        <DragOverlay dropAnimation={null}>
          {activeId && activeNote ? (
            <StickyNoteView
              title={activeNote.title}
              category={activeNote.category}
              isOverlay={true}
            />
          ) : null}
        </DragOverlay>
      </div>
    </DndContext>
  );
}

export default App;
