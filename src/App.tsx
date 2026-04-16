import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { DndContext, MouseSensor, TouchSensor, DragOverlay, useSensors, useSensor } from '@dnd-kit/core';
import { AddNoteForm } from './components/common/AddNoteForm';
import { NoteModalTop } from './components/note-modal/NoteModal';
import { BoardReference } from './components/board/BoardReference';
import { PendingDrawer } from './components/pending/PendingDrawer';
import { useContainerResize } from './hooks/useContainerResize';
import { useDragOnBoard } from './hooks/useDragOnBoard';
import { StickyNoteView } from './components/sticky-note/StickyNoteView';
import { useAuthStore } from './store/useAuthStore';
import { LoginButton } from './components/auth/LoginButton';
import { LogoutButton } from './components/auth/LogoutButton';
import { AuthCallback } from './pages/AuthCallback';

/**
 * メインのボード画面コンポーネント
 */
const BoardPage: React.FC = () => {
  const { handleDragStart, handleDragEnd, activeId, notes, pendingNotes, boardRef } = useDragOnBoard();
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

/**
 * アプリケーションのルートコンポーネント
 */
function App() {
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const currentUser = useAuthStore((state) => state.currentUser);
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);
  console.log(`Current User: ${currentUser}`);
  console.log(`Logged In: ${isLoggedIn}`);

  return (
    <div className="min-h-screen flex flex-col">
      {/* 共通ヘッダー */}
      <header className="h-16 flex items-center justify-between px-6 bg-white border-b border-gray-200 z-50">
        <h1 className="text-xl font-bold text-gray-800">Care Compass</h1>
        <div className="flex items-center gap-4">
          {isLoggedIn && currentUser ? (
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-700">{currentUser.name}</p>
                <p className="text-xs text-gray-400">{currentUser.email}</p>
              </div>
              {currentUser.picture && (
                <img src={currentUser.picture} alt={currentUser.name} className="w-8 h-8 rounded-full border border-gray-200" />
              )}
              <LogoutButton />
            </div>
          ) : (
            <LoginButton />
          )}
        </div>
      </header>

      {/* メインコンテンツエリア */}
      <main className="flex-1 relative overflow-hidden">
        <Routes>
          <Route path="/" element={<BoardPage />} />
          <Route path="/auth/google/callback" element={<AuthCallback />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
