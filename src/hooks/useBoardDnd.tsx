import { useCallback } from 'react';
import { MouseSensor, TouchSensor, DragOverlay, useSensors, useSensor } from '@dnd-kit/core';
import { useStore } from '../store/useStore';
import { useDragOnBoard } from "./useDragOnBoard"
import { StickyNoteView } from '../components/sticky-note/StickyNoteView';

export const useBoardDnd = () => {
  const { notes, pendingNotes, activeId, handleDragStart, handleDragEnd, handleDragCancel, boardRef } = useDragOnBoard();
  const activeCategory = useStore(state => state.activeCategory);

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

  const activeOverlay = useCallback(() => {
    return (
      <DragOverlay dropAnimation={null}>
        {activeId && activeNote ? (
          <StickyNoteView
            title={activeNote.title}
            category={activeNote.category}
            isOverlay={true}
            activeCategory={activeCategory}
          />
        ) : null}
      </DragOverlay>
    );
  }, [activeId, activeNote, activeCategory]);

  return {
    sensors,
    handleDragStart,
    handleDragEnd,
    handleDragCancel,
    activeOverlay,
    boardRef
  };
}