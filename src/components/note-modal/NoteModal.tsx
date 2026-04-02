import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { useStore } from '../../store/useStore';
import { type Category, type QuadrantId } from '../../types/index';
import { useNoteActions } from '../../hooks/useNoteAction';

export const NoteModal = () => {
  const { notes, pendingNotes, selectedNoteId, selectNote, updateNote, deleteNote, moveToBoard } = useStore();

  // ボード上のノートか、保留ボックスのノートかを探す
  const note = notes.find((n) => n.id === selectedNoteId) ||
    pendingNotes.find((n) => n.id === selectedNoteId);

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editCategory, setEditCategory] = useState<Category>('house');

  if (!note) return null;

  const isPending = note.status === 'pending';

  const [newComment, setNewComment] = useState('');
  const [isAppending, setIsAppending] = useState(false);

  const { appendComment, addNoteToBoard } = useNoteActions(note.id);

  const handleAppendComment = () => {
    if (!newComment.trim()) return;
    appendComment(editContent, newComment);
    // useEffect 内、重複だからここではいらないと思う
    // setEditContent(appendedContent);
    // setNewComment('');
    // setIsAppending(false);
  };

  const handleSave = () => {
    updateNote(note.id, {
      title: editTitle,
      content: editContent,
      category: editCategory
    });
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (window.confirm('この付箋を削除してもよろしいですか？')) {
      deleteNote(note.id);
      selectNote(null);
    }
  };

  const handleAddToBoard = (quadrant: QuadrantId) => {
    addNoteToBoard(quadrant);
    selectNote(null);
  };

  // ノートが切り替わった時に状態を更新
  useEffect(() => {
    if (note) {
      setEditTitle(note.title);
      setEditContent(note.content);
      setEditCategory(note.category);
      setNewComment('');
      setIsAppending(false);
    }
  }, [note?.id]);
  console.log(newComment);
  console.log(isAppending);

  const categoryLabels: Record<Category, string> = {
    house: '🏠 居住・環境',
    food: '🍱 食生活',
    health: '💪 身体・体力',
    medical: '💊 医療・健康',
    social: '🧑‍🤝‍🧑 社会・交流',
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div
        className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
          <div className="flex-1">
            {isEditing ? (
              <input
                className="w-full font-bold text-xl border-b-2 border-blue-500 outline-none bg-transparent py-1"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="タイトルを入力..."
                autoFocus
              />
            ) : (
              <div className="flex items-center gap-3">
                <span className="text-2xl">{categoryLabels[note.category].split(' ')[0]}</span>
                <h2 className="font-bold text-xl text-gray-800">{note.title}</h2>
                {isPending && (
                  <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded-full font-semibold">
                    保留中
                  </span>
                )}
              </div>
            )}
          </div>
          <button
            onClick={() => selectNote(null)}
            className="ml-4 text-gray-400 hover:text-gray-600 transition-colors p-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        {/* コンテンツエリア */}
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          {isEditing ? (
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
          ) : (
            <div>
              <div className="mb-4 flex items-center gap-2">
                <span className="text-sm font-medium text-gray-500">カテゴリ:</span>
                <span className="text-sm px-2 py-0.5 bg-gray-100 rounded text-gray-700">
                  {categoryLabels[note.category]}
                </span>
              </div>
              <div className="prose prose-blue max-w-none bg-blue-50/30 p-6 rounded-2xl border border-blue-100 shadow-sm mb-6">
                <ReactMarkdown>{note.content || "*詳細はありません*"}</ReactMarkdown>
              </div>

              {/* 追記モードのUI */}
              <div className="mt-6 border-t pt-6">
                {!isAppending ? (
                  <button
                    onClick={() => setIsAppending(true)}
                    className="flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
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
            </div>
          )}
        </div>

        {/* 履歴エリア (非編集時のみ) */}
        {!isEditing && note.history && note.history.length > 0 && (
          <div className="px-6 py-4 border-t bg-gray-50/50">
            <h3 className="font-bold text-sm mb-2 text-gray-600 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              変更履歴
            </h3>
            <ul className="text-xs text-gray-500 space-y-1 max-h-20 overflow-y-auto custom-scrollbar">
              {note.history.map((h, index) => (
                <li key={index} className="flex gap-2">
                  <span className="text-gray-400 shrink-0">{new Date(h.timestamp).toLocaleString([], { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                  <span className="font-medium">{h.from}</span>
                  <span className="text-gray-300">→</span>
                  <span className="font-medium text-blue-600">{h.to}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* フッター */}
        <div className="px-6 py-4 border-t bg-gray-50 flex flex-wrap justify-between items-center gap-4">
          <button
            onClick={handleDelete}
            className="text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            削除する
          </button>

          <div className="flex gap-3 ml-auto">
            {isEditing ? (
              <>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleSave}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition-all font-semibold"
                >
                  保存する
                </button>
              </>
            ) : (
              <>
                {isPending ? (
                  <div className="flex gap-2">
                    <span className="text-xs text-gray-400 self-center mr-1">ボードに追加:</span>
                    <button onClick={() => handleAddToBoard('can')} className="px-3 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200 transition-colors">できる</button>
                    <button onClick={() => handleAddToBoard('cannot')} className="px-3 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200 transition-colors">できない</button>
                    <button onClick={() => handleAddToBoard('risk')} className="px-3 py-1 bg-orange-100 text-orange-700 rounded text-xs hover:bg-orange-200 transition-colors">危険</button>
                    <button onClick={() => handleAddToBoard('request')} className="px-3 py-1 bg-purple-100 text-purple-700 rounded text-xs hover:bg-purple-200 transition-colors">頼みたい</button>
                  </div>
                ) : null}
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-6 py-2 bg-gray-800 text-white rounded-lg shadow-md hover:bg-black transition-all font-semibold"
                >
                  編集する
                </button>
                <button
                  onClick={() => selectNote(null)}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition-all font-semibold"
                >
                  閉じる
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};