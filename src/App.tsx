import { DndContext, type DragEndEvent } from '@dnd-kit/core';
import { useStore } from './store/useStore';
import { StickyNote } from './components/sticky-note/StickyNote';
import { AddNoteForm } from './components/common/AddNoteForm';
import { NoteModal } from './components/common/NoteModal';

function App() {
  const { notes, updateNotePosition } = useStore();

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, delta } = event;
    const note = notes.find((n) => n.id === active.id);
    if (note) {
      // 元の座標に移動量を足して保存
      updateNotePosition(String(active.id), note.x + delta.x, note.y + delta.y);
    }
  };

  // <div className="fixed bottom-8 right-8 w-14 h-14 bg-blue-600 text-white rounded-full shadow-2xl text-3xl flex items-center justify-center hover:bg-blue-700 transition-transform hover:scale-110 z-40"> --></div>
  return (
    <div>
      <NoteModal />
      <AddNoteForm />
      <div className="h-screen w-screen bg-gray-100 relative overflow-hidden">
        {/* 4分割の十字線（見た目だけ） */}
        <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
          <div className="border-r border-b border-gray-300 p-4 text-gray-400">できる</div>
          <div className="border-b border-gray-300 p-4 text-gray-400">頼みたい</div>
          <div className="border-r border-gray-300 p-4 text-gray-400">危険</div>
          <div className="p-4 text-gray-400">できない</div>
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