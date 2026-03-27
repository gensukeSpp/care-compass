import { describe, it, expect, beforeEach } from 'vitest';
import { useStore } from './useStore';

describe('useStore', () => {
  beforeEach(() => {
    // Reset store state if necessary
    // Note: Zustand persist might keep state between tests if not handled.
    // For simplicity, we'll just test the current functionality.
  });

  it('should add a note', () => {
    const { addNote } = useStore.getState();
    const initialNotesCount = useStore.getState().notes.length;
    
    addNote('Test Note', 'Test Content', 'health', 'can');
    
    const notes = useStore.getState().notes;
    expect(notes.length).toBe(initialNotesCount + 1);
    expect(notes[notes.length - 1].title).toBe('Test Note');
  });

  it('should update note position', () => {
    const { notes, updateNotePosition } = useStore.getState();
    const noteId = notes[0].id;
    
    updateNotePosition(noteId, 50, 50);
    
    const updatedNote = useStore.getState().notes.find(n => n.id === noteId);
    expect(updatedNote?.x).toBe(50);
    expect(updatedNote?.y).toBe(50);
  });

  it('should select a note', () => {
    const { notes, selectNote } = useStore.getState();
    const noteId = notes[0].id;
    
    selectNote(noteId);
    expect(useStore.getState().selectedNoteId).toBe(noteId);
    
    selectNote(null);
    expect(useStore.getState().selectedNoteId).toBe(null);
  });

  it('should delete a note', () => {
    const { notes, deleteNote } = useStore.getState();
    const noteId = notes[0].id;
    const initialNotesCount = notes.length;
    
    deleteNote(noteId);
    expect(useStore.getState().notes.length).toBe(initialNotesCount - 1);
    expect(useStore.getState().notes.find(n => n.id === noteId)).toBeUndefined();
  });
});
