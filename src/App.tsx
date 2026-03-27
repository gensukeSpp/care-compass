import { useEffect } from 'react';
import { DndContext, type DragEndEvent } from '@dnd-kit/core';
import { useStore } from './store/useStore';
import { StickyNote } from './components/sticky-note/StickyNote';
import { AddNoteForm } from './components/common/AddNoteForm';
import { NoteModal } from './components/common/NoteModal';
import { pixelsToPercentage, getQuadrantFromPosition } from './utils/positionUtils';

function App() {
  const { notes, updateNotePosition, containerDimensions, setContainerDimensions, selectedNoteId, updateNoteStatus } = useStore();

  useEffect(() => {
    const updateSize = () => {
      setContainerDimensions(window.innerWidth, window.innerHeight);
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [setContainerDimensions]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, delta } = event;
    const note = notes.find((n) => n.id === active.id);
    if (note && containerDimensions.width > 0 && containerDimensions.height > 0) {
      // delta(px) を比率(%)に変換して足す
      const dxPct = pixelsToPercentage(delta.x, containerDimensions.width);
      const dyPct = pixelsToPercentage(delta.y, containerDimensions.height);
      const newX = note.x + dxPct;
      const newY = note.y + dyPct;

      updateNotePosition(String(active.id), newX, newY);

      const newStatus = getQuadrantFromPosition(newX, newY);
      if (note.status !== newStatus) {
        updateNoteStatus(String(active.id), newStatus);
      }
    }
  };

  // <div className="fixed bottom-8 right-8 w-14 h-14 bg-blue-600 text-white rounded-full shadow-2xl text-3xl flex items-center justify-center hover:bg-blue-700 transition-transform hover:scale-110 z-40"> --></div>
  return (
    <div>
      <NoteModal key={selectedNoteId} />
      <AddNoteForm />
      <div className="h-screen w-screen bg-gray-100 relative overflow-hidden">
        {/* 4分割の十字線（見た目だけ） */}
        <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
          <div className="border-r border-b border-gray-300 p-4 text-gray-400">できる</div>
          <div className="border-b border-gray-300 p-4 text-gray-400">できない</div>
          <div className="border-r border-gray-300 p-4 text-gray-400">危険を伴う</div>
          <div className="p-4 text-gray-400">頼みたい</div>
        </div>
        <DndContext onDragEnd={handleDragEnd}>
          {notes.map((note) => (
            <StickyNote key={note.id} {...note} />
          ))}
        </DndContext>
      </div>
    </div>
  );
}

export default App;