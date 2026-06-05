import { useQuadrantLabels } from '../../hooks/useQuadrantLabels';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';

interface HistoryTimelineViewProps {
  history: {
    history_id: string;
    note_id: string;
    note_title: string;
    from_status: string;
    to_status: string;
    created_at: string;
  }[];
}

export function HistoryTimelineView({ history }: HistoryTimelineViewProps) {
  const { getLabel } = useQuadrantLabels();
  const selectNote = useStore((s) => s.selectNote);
  const navigate = useNavigate();

  if (history.length === 0) {
    return <div className="text-center text-gray-500 py-10">履歴はありません。</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm text-gray-600" aria-label="変更履歴一覧">
        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
          <tr>
            <th className="px-6 py-3">日時</th>
            <th className="px-6 py-3">付箋タイトル</th>
            <th className="px-6 py-3">状態変化</th>
          </tr>
        </thead>
        <tbody>
          {history.map((h) => (
            <tr
              key={h.history_id}
              className="bg-white border-b hover:bg-gray-50 cursor-pointer"
              role="button"
              tabIndex={0}
              onClick={() => {
                selectNote(h.note_id);
                navigate('/');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  selectNote(h.note_id);
                  navigate('/');
                }
              }}
            >
              <td className="px-6 py-4 whitespace-nowrap">
                {new Date(h.created_at).toLocaleString('ja-JP', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </td>
              <td className="px-6 py-4 font-medium text-gray-900">{h.note_title}</td>
              <td className="px-6 py-4">
                <span className="bg-gray-100 px-2 py-1 rounded text-xs">{getLabel(h.from_status as any)}</span>
                <span className="mx-2 text-gray-400">→</span>
                <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded text-xs">{getLabel(h.to_status as any)}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
