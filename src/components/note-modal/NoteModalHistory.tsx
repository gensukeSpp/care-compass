import { Clock } from "lucide-react";
import { type Note } from "../../types/index";

interface NoteHistoryProps {
  note: Note;
  isEditing: boolean;
}

export function NoteQuadHistory({ note, isEditing }: NoteHistoryProps) {
  return (
    <>
      {!isEditing && note.history && note.history.length > 0 &&
        <div className="px-6 py-4 border-t bg-gray-50/50">
          <h3 className="font-bold text-sm mb-2 text-gray-600 flex items-center gap-2">
            <Clock width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></Clock>
            変更履歴
          </h3>
          <ul className="text-xs text-gray-500 space-y-1 max-h-20 overflow-y-auto custom-scrollbar">
            {note.history.map((h, index) => (
              <li key={index} className="flex gap-2">
                {h.timestamp &&
                  <span className="text-gray-400 shrink-0">{new Date(h.timestamp).toLocaleString([], { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                }
                <span className="font-medium">{h.from}</span>
                <span className="text-gray-300">→</span>
                <span className="font-medium text-blue-600">{h.to}</span>
              </li>
            ))}
          </ul>
        </div>
      }
    </>
  );
}