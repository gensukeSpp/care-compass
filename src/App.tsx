import { useStore } from './store/useStore';
import { AddNoteForm } from './components/common/AddNoteForm';
import { NoteModal } from './components/common/NoteModal';
import { Board } from './components/board/Board';
import { useContainerResize } from './hooks/useContainerResize';

function App() {
  const { selectedNoteId } = useStore();
  useContainerResize();

  // <div className="fixed bottom-8 right-8 w-14 h-14 bg-blue-600 text-white rounded-full shadow-2xl text-3xl flex items-center justify-center hover:bg-blue-700 transition-transform hover:scale-110 z-40"> --></div>
  return (
    <div>
      <NoteModal key={selectedNoteId} />
      <AddNoteForm />
      <Board />
    </div>
  );
}

export default App;