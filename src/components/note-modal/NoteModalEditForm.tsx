import { type Category } from "../../types";

interface NoteEditProps {
  categoryLabels: Record<Category, string>;
  editContent: string;
  setEditContent: (content: string) => void;
  editCategory: Category;
  setEditCategory: (category: Category) => void;
}

export function NoteEditForm({ categoryLabels, editContent, setEditContent, editCategory, setEditCategory }: NoteEditProps) {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">カテゴリ</label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {(Object.keys(categoryLabels) as Category[]).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setEditCategory(cat)}
              className={`text-sm px-3 py-2 rounded-lg border transition-all ${editCategory === cat
                ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm'
                : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
            >
              {categoryLabels[cat]}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">詳細内容 (Markdown形式)</label>
        <textarea
          className="w-full border border-gray-200 p-4 rounded-xl h-64 font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all shadow-inner bg-gray-50"
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          placeholder="詳細をMarkdown形式で入力してください..."
        />
      </div>
    </div>
  );
}