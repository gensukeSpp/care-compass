import React from 'react';
import { LogIn } from 'lucide-react';
import { DndContext, MouseSensor, TouchSensor, DragOverlay, useSensors, useSensor } from '@dnd-kit/core';
import { AddNoteForm } from '../../components/common/AddNoteForm';
import { NoteModalTop } from '../../components/note-modal/NoteModal';
import { BoardReference } from './BoardReference';
import { PendingDrawer } from '../../components/pending/PendingDrawer';
import { useContainerResize } from '../../hooks/useContainerResize';
import { useDragOnBoard } from '../../hooks/useDragOnBoard';
import { StickyNoteView } from '../../components/sticky-note/StickyNoteView';
import { useAuthStore } from '../../store/useAuthStore';
import { CreateProfileModal } from '../../components/common/CreateProfileModal';

/**
 * メインのボード画面コンポーネント
 */
export const BoardPage: React.FC = () => {
  const { handleDragStart, handleDragEnd, activeId, notes, pendingNotes, boardRef } = useDragOnBoard();
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const currentProfileId = useAuthStore((state) => state.currentProfileId);
  const currentProfiles = useAuthStore((state) => state.currentProfiles);
  const isLoading = useAuthStore((state) => state.isLoading);
  const login = useAuthStore((state) => state.login);

  useContainerResize();

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  );

  const activeNote = notes.find(n => n.id === activeId) || pendingNotes.find(n => n.id === activeId);

  // 1. ログインしていない場合
  if (!isLoggedIn) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] bg-gray-50 p-6">
        <div className="bg-white p-10 rounded-3xl shadow-xl shadow-gray-200 text-center max-w-lg border border-gray-100">
          <div className="w-20 h-20 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-6 text-indigo-600">
            <LogIn className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">ケア・コンパスへようこそ</h2>
          <p className="text-gray-600 mb-8 leading-relaxed">
            大切な方の自立と安全を可視化し、家族でサポートを共有するための4象限ボードです。
            まずはログインしてボードを作成しましょう。
          </p>
          <button
            onClick={login}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-200 transition-all text-lg"
          >
            Googleでログイン
          </button>
        </div>
      </div>
    );
  }

  // 2. 読み込み中の場合
  if (isLoading && !currentProfileId) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // 3. ログインしているがプロファイルがない場合
  if (currentProfiles.length === 0) {
    return <CreateProfileModal />;
  }

  // 4. プロファイルが選択されている場合
  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="relative min-h-screen overflow-hidden bg-gray-50">
        <NoteModalTop />
        <AddNoteForm />
        <BoardReference ref={boardRef} />
        <PendingDrawer />

        <DragOverlay dropAnimation={null}>
          {activeId && activeNote ? (
            <StickyNoteView
              title={activeNote.title}
              category={activeNote.category}
              isOverlay={true}
            />
          ) : null}
        </DragOverlay>
      </div>
    </DndContext>
  );
};
