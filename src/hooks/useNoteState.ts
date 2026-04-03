import { useState } from 'react';

import { useStore } from '../store/useStore';
import type { Category } from '../types';

export const useNoteModalState = () => {
  const { notes, pendingNotes, selectNote } = useStore();
  const selectedNoteId = useStore((state) => state.selectedNoteId);

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editCategory, setEditCategory] = useState<Category>('house');
  const [newComment, setNewComment] = useState('');
  const [isAppending, setIsAppending] = useState(false);

  // ボード上のノートか、保留ボックスのノートかを探す
  const note = notes.find((n) => n.id === selectedNoteId) ||
    pendingNotes.find((n) => n.id === selectedNoteId);

  const isPending = note?.status === 'pending';

  return {
    note,
    isEditing,
    setIsEditing,
    editTitle,
    setEditTitle,
    editContent,
    setEditContent,
    editCategory,
    setEditCategory,
    newComment,
    setNewComment,
    isAppending,
    setIsAppending,
    isPending,
    selectNote,
  };
};