import { useState } from 'react';

import { useStore } from '../store/useStore';
import { calculateInitialPosition } from '../utils/positionUtils';
import type { QuadrantId } from '../types';

export const useNoteActions = (noteId: string) => {
  const { updateNote, moveToBoard } = useStore();

  const appendComment = (currentContent: string, comment: string) => {
    const timestamp = new Date().toLocaleString();
    const appendedContent = `${currentContent}\n\n---\n**${timestamp}**\n${comment}`;
    updateNote(noteId, { content: appendedContent });
    console.log(appendedContent);
  };

  const addNoteToBoard = (quadrant: QuadrantId) => {
    const { x, y } = calculateInitialPosition(quadrant); // positionUtils 等から取得
    moveToBoard(noteId, x, y);
  };

  return { appendComment, addNoteToBoard };
};