import { useState } from 'react';

import { useStore } from '../../store/useStore';
import { type Category, type QuadrantId } from '../../types/index';

export const AddNoteForm = () => {
  const addNote = useStore((state) => state.addNote);
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<Category>('house');
  const [quadrant, setQuadrant] = useState<QuadrantId>('can');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;
    addNote(title, content, category, quadrant);
    setTitle('');
    setContent('');
    setIsOpen(false); // 送信後に閉じる
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 w-14 h-14 bg-blue-600 text-white rounded-full shadow-2xl text-3xl flex items-center justify-center hover:bg-blue-700 transition-transform hover:scale-110 z-40"
      >
        ＋
      </button>
    );
  }

  return (
    <div className="fixed bottom-24 right-8 w-80 bg-white p-6 rounded-xl shadow-2xl border border-gray-200 z-40 animate-in fade-in slide-in-from-bottom-4">
      <h3 className="font-bold mb-4 text-gray-700">新しい付箋を追加</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          placeholder="タイトル（例：買い物）"
          className="w-full border p-2 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <select
          className="w-full border p-2 rounded text-sm bg-white"
          value={category}
          onChange={(e) => setCategory(e.target.value as Category)}
        >
          <option value="house">🏠 居住・環境</option>
          <option value="food">🍱 食生活</option>
          <option value="health">💪 体力づくり</option>
          <option value="medical">💊 医療・健康</option>
          <option value="social">🧑‍🤝‍🧑 社会活動</option>
        </select>
        <select
          className="w-full border p-2 rounded text-sm bg-white"
          value={quadrant}
          onChange={(e) => setQuadrant(e.target.value as QuadrantId)}
        >
          <option value="can">できる</option>
          <option value="cannot">できない</option>
          <option value="risk">危険を伴う</option>
          <option value="request">頼みたい</option>
          <option value="neutral">保留</option>
        </select>
        <textarea
          placeholder="詳細（Markdown形式で追記可能）"
          className="w-full border p-2 rounded text-sm h-24 focus:ring-2 focus:ring-blue-500 outline-none"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <div className="flex justify-end gap-2 text-xs">
          <button type="button" onClick={() => setIsOpen(false)} className="px-3 py-1 text-gray-500">キャンセル</button>
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 shadow-md">
            追加する
          </button>
        </div>
      </form>
    </div>
  );
};