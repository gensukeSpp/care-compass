import { useState } from "react";
import { SquarePen } from "lucide-react";
import { useNoteActions } from "../../hooks/useNoteAction";
import { type Note } from "../../types";

interface NoteAppendProps {
  note: Note;
  editContent: string;
}

export function NoteAppendWithTimestamp({ note, editContent }: NoteAppendProps) {
  const [newComment, setNewComment] = useState('');
  const [isAppending, setIsAppending] = useState(false);
  const { appendComment } = useNoteActions(note?.id || '');

  const handleAppendComment = () => {
    if (!newComment.trim()) return;
    appendComment(editContent, newComment);
    // useEffect 内、重複だからここではいらないと思う
    // setEditContent(appendedContent);
    setNewComment('');
    setIsAppending(false);
  };
  console.log(isAppending);

  return (
    <div className="mt-6 border-t pt-6">
      {!isAppending ? (
        <button
          onClick={() => setIsAppending(true)}
          className="flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors"
        >
          <SquarePen width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></SquarePen>
          追記する (タイムスタンプ付き)
        </button>
      ) : (
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 animate-in slide-in-from-top-2">
          <label className="block text-xs font-bold text-gray-500 uppercase mb-2">新しいコメント</label>
          <textarea
            className="w-full border border-gray-200 p-3 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none h-24 bg-white"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="「今日は〇〇ができた」などの気づきを追記..."
            autoFocus
          />
          <div className="flex justify-end gap-2 mt-3">
            <button
              onClick={() => setIsAppending(false)}
              className="px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-200 rounded-md transition-colors"
            >
              キャンセル
            </button>
            <button
              onClick={handleAppendComment}
              disabled={!newComment.trim()}
              className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-bold shadow-sm"
            >
              追記を追加
            </button>
          </div>
        </div>
      )}
    </div>
  );
}