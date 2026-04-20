import React from 'react';
import { DndContext, MouseSensor, TouchSensor, DragOverlay, useSensors, useSensor } from '@dnd-kit/core';
import { AddNoteForm } from '../../components/common/AddNoteForm';
import { NoteModalTop } from '../../components/note-modal/NoteModal';
import { BoardReference } from './BoardReference';
import { PendingDrawer } from '../../components/pending/PendingDrawer';
import { useContainerResize } from '../../hooks/useContainerResize';
import { useDragOnBoard } from '../../hooks/useDragOnBoard';
import { StickyNoteView } from '../../components/sticky-note/StickyNoteView';

/**
 * メインのボード画面コンポーネント
 */
export const BoardPage: React.FC = () => {
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
