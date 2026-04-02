import { DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { useStore } from './store/useStore';
import { AddNoteForm } from './components/common/AddNoteForm';
import { NoteModal } from './components/note-modal/NoteModal';
import { Board } from './components/board/Board';
import { PendingDrawer } from './components/pending/PendingDrawer';
import { useContainerResize } from './hooks/useContainerResize';
import { useBoardLogic } from './hooks/useDragOnBoard';

function App() {
  const { selectedNoteId } = useStore();
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
        <NoteModal key={selectedNoteId} />
        <AddNoteForm />
        <Board />
        <PendingDrawer />
      </div>
    </DndContext>
  );
}

export default App;
