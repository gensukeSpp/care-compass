import { DndContext, useSensors, useSensor, PointerSensor } from '@dnd-kit/core';
import { AddNoteForm } from './components/common/AddNoteForm';
import { NoteModalTop } from './components/note-modal/NoteModal';
import { Board } from './components/board/Board';
import { PendingDrawer } from './components/pending/PendingDrawer';
import { useContainerResize } from './hooks/useContainerResize';
import { useBoardLogic } from './hooks/useDragOnBoard';

function App() {
  const { handleDragEnd } = useBoardLogic();
  useContainerResize();

  // センサーの設定: クリックとドラッグを共存させるための距離閾値
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="relative min-h-screen">
        <NoteModalTop />
        <AddNoteForm />
        <Board />
        <PendingDrawer />
      </div>
    </DndContext>
  );
}

export default App;
