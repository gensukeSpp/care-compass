import ReactMarkdown from 'react-markdown';
import { type Note } from '../../types';

interface NoteContentProps {
  note: Note;
  categoryLabel: string;
}

export function NoteContentView({ note, categoryLabel }: NoteContentProps) {
  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <span className="text-sm font-medium text-gray-500">カテゴリ:</span>
        <span className="text-sm px-2 py-0.5 bg-gray-100 rounded text-gray-700">
          {categoryLabel}
        </span>
      </div>
      <div className="prose prose-blue max-w-none bg-blue-50/30 p-6 rounded-2xl border border-blue-100 shadow-sm mb-6">
        <ReactMarkdown>{note.content || "*詳細はありません*"}</ReactMarkdown>
      </div>
    </div>
  );
}