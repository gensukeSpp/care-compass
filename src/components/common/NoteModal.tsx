import ReactMarkdown from 'react-markdown';
import { useStore } from '../../store/useStore';

export const NoteModal = () => {
  const { notes, selectedNoteId, selectNote } = useStore();
  const note = notes.find((n) => n.id === selectedNoteId);

  if (!note) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-lg rounded-lg shadow-xl overflow-hidden flex flex-col max-h-[80vh]">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <h2 className="font-bold text-lg">{note.title}</h2>
          <button onClick={() => selectNote(null)} className="text-gray-500 hover:text-black text-xl">×</button>
        </div>

        <div className="p-6 overflow-y-auto prose prose-sm max-w-none">
          {/* Markdownを表示 */}
          <ReactMarkdown>{note.content}</ReactMarkdown>
        </div>

        <div className="p-4 border-t bg-gray-50 text-right">
          <button
            onClick={() => selectNote(null)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};