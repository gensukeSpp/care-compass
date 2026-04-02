import { useStore } from './store/useStore';
import { AddNoteForm } from './components/common/AddNoteForm';
import { NoteModal } from './components/common/NoteModal';
import { Board } from './components/board/Board';
import { PendingDrawer } from './components/pending/PendingDrawer';
import { useContainerResize } from './hooks/useContainerResize';

function App() {
  const { selectedNoteId } = useStore();
  useContainerResize();

  return (
    <div>
      <NoteModal key={selectedNoteId} />
      <AddNoteForm />
      <Board />
      <PendingDrawer />
    </div>
  );
}

export default App;
