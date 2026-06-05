import { useQuadrantLabels } from '../../hooks/useQuadrantLabels';
import { type Note } from '../../types/index';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';

interface HistoryNoteViewProps {
  history: {
    history_id: string;
    note_id: string;
    note_title: string;
    from_status: string;
    to_status: string;
    created_at: string;
  }[];
  allNotes: Note[]; // Add allNotes to identify notes without history
}

export function HistoryNoteView({ history, allNotes }: HistoryNoteViewProps) {
  const { getLabel } = useQuadrantLabels();
  const selectNote = useStore((s) => s.selectNote);
  const navigate = useNavigate();

  // Create a map for quick history lookup
  const historyByNoteId = history.reduce((acc, h) => {
    if (!acc[h.note_id]) {
      acc[h.note_id] = [];
    }
    acc[h.note_id].push(h);
    return acc;
  }, {} as Record<string, typeof history>);

  return (
    <div className="space-y-6">
      {allNotes.map((note) => {
        const noteHistory = historyByNoteId[note.id] || [];
        
        return (
          <div key={note.id} className="border rounded-lg p-4 bg-gray-50">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-lg text-gray-800">{note.title}</h3>
              <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                現在: {getLabel(note.status)}
              </span>
            </div>
            
            {noteHistory.length > 0 ? (
              <ul className="space-y-2" role="list" aria-label={`履歴一覧: ${note.title}`}>
                {noteHistory.map((h) => (
                  <li
                    key={h.history_id}
                    className="text-sm text-gray-600 flex items-center gap-4 bg-white p-2 rounded border cursor-pointer"
                    role="button"
                    tabIndex={0}
                    onClick={() => { selectNote(h.note_id); navigate('/'); }}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectNote(h.note_id); navigate('/'); } }}
                  >
                    <span className="text-gray-400 text-xs w-28">
                      {new Date(h.created_at).toLocaleString('ja-JP', {
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <span className="bg-gray-100 px-2 py-1 rounded text-xs">{getLabel(h.from_status as any)}</span>
                    <span className="text-gray-400">→</span>
                    <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded text-xs">{getLabel(h.to_status as any)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500 italic">履歴はありません。</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
