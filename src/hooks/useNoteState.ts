import { useState, useEffect } from 'react';

import { useStore } from '../store/useStore';
import type { Category } from '../types';

export const useNoteModalState = () => {
  const { notes, pendingNotes, selectNote } = useStore();
  const selectedNoteId = useStore((state) => state.selectedNoteId);

  const [isEditing, setIsEditing] = useState(false);
  const [isAppending, setIsAppending] = useState(false);

  // 編集用のstate
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editCategory, setEditCategory] = useState<Category>('house');

  // ボード上のノートか、保留ボックスのノートかを探す
  const note = notes.find((n) => n.id === selectedNoteId) ||
    pendingNotes.find((n) => n.id === selectedNoteId);

  const isPending = note?.status === 'pending';

  // noteが変わった時に編集stateを初期化
  useEffect(() => {
    if (note) {
      Promise.resolve().then(() => {
        setEditTitle(note.title);
        setEditContent(note.content);
        setEditCategory(note.category);
      });
    }
  }, [note]);

  return {
    note,
    isEditing,
    setIsEditing,
    isAppending,
    setIsAppending,
    isPending,
    selectNote,
    editTitle,
    setEditTitle,
    editContent,
    setEditContent,
    editCategory,
    setEditCategory,
  };
};