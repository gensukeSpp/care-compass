import { useState } from 'react';

import ReactMarkdown from 'react-markdown';

import { useStore } from '../../store/useStore';
import { type Category } from '../../types/index';

export const NoteModal = () => {
  const { notes, selectedNoteId, selectNote, updateNote, deleteNote } = useStore();
  const note = notes.find((n) => n.id === selectedNoteId);

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(note?.title || '');
  const [editContent, setEditContent] = useState(note?.content || '');
  const [editCategory, setEditCategory] = useState<Category>(note?.category || 'house');

  if (!note) return null;

  const handleSave = () => {
    updateNote(note.id, { title: editTitle, content: editContent, category: editCategory });
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (window.confirm('この付箋を削除してもよろしいですか？')) {
      deleteNote(note.id);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-lg rounded-lg shadow-xl overflow-hidden flex flex-col max-h-[80vh]">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          {/* <h2 className="font-bold text-lg">{note.title}</h2> */}
          {isEditing ? (
            <input
              className="font-bold text-lg border-b-2 border-blue-500 outline-none w-full mr-4 bg-transparent"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
            />
          ) : (
            <h2 className="font-bold text-lg text-gray-800">{note.title}</h2>
          )}
          <button onClick={() => selectNote(null)} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
        </div>

        {/* コンテンツエリア */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* Markdownを表示 */}
          {/* <ReactMarkdown>{note.content}</ReactMarkdown> */}
          {isEditing ? (
            <div className="space-y-4">
              <select
                className="w-full border p-2 rounded bg-white text-sm"
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value as Category)}
              >
                <option value="house">🏠 居住・環境</option>
                <option value="food">🍱 食生活</option>
                <option value="health">💪 身体・体力</option>
                <option value="medical">💊 医療・健康</option>
                <option value="social">🧑‍🤝‍🧑 社会・交流</option>
              </select>
              <textarea
                className="w-full border p-4 rounded-lg h-64 font-mono text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                placeholder="Markdownで詳細を入力..."
              />
            </div>
          ) : (
            <div className="prose prose-blue max-w-none">
              <ReactMarkdown>{note.content || "*詳細なし*"}</ReactMarkdown>
            </div>
          )}
        </div>

        {/* 履歴エリア */}
        {note.history && note.history.length > 0 && (
          <div className="p-4 border-t bg-gray-50">
            <h3 className="font-bold text-sm mb-2 text-gray-600">変更履歴</h3>
            <ul className="text-xs text-gray-500 space-y-1 max-h-24 overflow-y-auto">
              {note.history.map((h, index) => (
                <li key={h.timestamp}>
                  {new Date(h.timestamp).toLocaleString()}: {h.from} → {h.to}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* フッター（アクション） */}
        <div className="p-4 border-t bg-gray-50 flex justify-between items-center">
          <button
            onClick={handleDelete}
            className="text-red-500 hover:text-red-700 text-sm font-medium transition-colors"
          >
            削除する
          </button>

          <div className="flex gap-3">
            {isEditing ? (
              <>
                <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg">キャンセル</button>
                <button onClick={handleSave} className="px-6 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700">保存</button>
              </>
            ) : (
              <button onClick={() => setIsEditing(true)} className="px-6 py-2 bg-gray-800 text-white rounded-lg shadow-md hover:bg-black">編集する</button>
            )}
          </div>
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