import { useState } from 'react';
import { useStore } from '../../store/useStore';
import { PendingNoteItem } from './PendingNoteItem';

export const PendingDrawer = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { pendingNotes, selectNote } = useStore();

  return (
    <div
      className={`fixed top-0 right-0 h-full bg-gray-50 border-l shadow-2xl transition-transform duration-300 ease-in-out z-40 flex ${
        isOpen ? 'translate-x-0' : 'translate-x-[calc(100%-40px)]'
      }`}
      style={{ width: '320px' }}
    >
      {/* 持ち手 (Handle) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-24 bg-blue-600 text-white rounded-l-lg self-center flex items-center justify-center hover:bg-blue-700 transition-colors shadow-md"
      >
        <span className={`transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
          ◀
        </span>
      </button>

      {/* コンテンツ領域 */}
      <div className="flex-1 flex flex-col p-4 overflow-hidden">
        <div className="flex justify-between items-center mb-4 border-b pb-2">
          <h2 className="font-bold text-lg text-gray-700 flex items-center gap-2">
            <span>📥</span> 保留ボックス
          </h2>
          <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
            {pendingNotes.length}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          {pendingNotes.length === 0 ? (
            <div className="text-center text-gray-400 mt-10">
              <p className="text-sm">保留中の付箋はありません</p>
              <p className="text-xs mt-2">Google KeepやMarkdownから<br/>追加したメモがここに表示されます</p>
            </div>
          ) : (
            pendingNotes.map((note) => (
              <PendingNoteItem key={note.id} note={note} onSelect={selectNote} />
            ))
          )}
        </div>
        
        {/* 下部アクション (任意) */}
        <div className="mt-4 pt-4 border-t text-xs text-gray-400 italic">
          ボードにドラッグして配置できます
        </div>
      </div>
    </div>
  );
};
