import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useStore } from './useStore';
import { useAuthStore } from './useAuthStore';
import { tasksSyncService } from '../services/tasksSyncService';

// tasksSyncService をモックする
vi.mock('../services/tasksSyncService', () => ({
  tasksSyncService: {
    fetchTasks: vi.fn()
  }
}));

// useAuthStore をモックする
vi.mock('./useAuthStore', () => ({
  useAuthStore: {
    getState: vi.fn(() => ({
      currentUser: { name: 'Test Author' }
    }))
  }
}));

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

  it('should add a note to pending when status is pending', () => {
    const { addNote } = useStore.getState();
    const initialNotesCount = useStore.getState().notes.length;
    const initialPendingCount = useStore.getState().pendingNotes.length;

    addNote('Pending Test Note', 'Pending Content', 'social', 'pending');

    // notes 配列は変わらない
    expect(useStore.getState().notes.length).toBe(initialNotesCount);
    // pendingNotes 配列に追加される
    expect(useStore.getState().pendingNotes.length).toBe(initialPendingCount + 1);
    const addedNote = useStore.getState().pendingNotes[0]; // 先頭に追加される
    expect(addedNote.title).toBe('Pending Test Note');
    expect(addedNote.status).toBe('pending');
  });

  it('should update note position', () => {
    const { notes, updateNotePositionAndStatus } = useStore.getState();
    const noteId = notes[0].id;

    updateNotePositionAndStatus(noteId, 50, 50);

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

  it('should update note status and record history', () => {
    const { updateNoteStatus, addNote } = useStore.getState();

    // このテスト専用のノートを追加して、テストの独立性を確保する
    addNote('History Test Note', 'Content', 'health', 'can');
    const notes = useStore.getState().notes;
    const noteToUpdate = notes[notes.length - 1]; // 最後に追加されたノートを取得
    const noteId = noteToUpdate.id;
    const originalStatus = noteToUpdate.status;
    const newStatus = 'cannot';

    updateNoteStatus(noteId, newStatus);

    const updatedNote = useStore.getState().notes.find(n => n.id === noteId);

    expect(updatedNote?.status).toBe(newStatus);
    expect(updatedNote?.history).toBeDefined();
    expect(updatedNote?.history?.length).toBe((noteToUpdate.history?.length || 0) + 1);

    const latestHistory = updatedNote?.history?.[updatedNote.history.length - 1];
    expect(latestHistory?.from).toBe(originalStatus);
    expect(latestHistory?.to).toBe(newStatus);
  });

  it('should handle pending notes', () => {
    const { addPendingNote, moveToBoard, moveToPending } = useStore.getState();
    const initialNotesCount = useStore.getState().notes.length;
    const initialPendingCount = useStore.getState().pendingNotes.length;

    // Add a pending note
    addPendingNote('Pending Note', 'Content', 'social');
    expect(useStore.getState().pendingNotes.length).toBe(initialPendingCount + 1);
    const pendingNote = useStore.getState().pendingNotes[0];
    expect(pendingNote.status).toBe('pending');

    // Move pending note to board
    moveToBoard(pendingNote.id, 20, 30);
    expect(useStore.getState().pendingNotes.length).toBe(initialPendingCount);
    expect(useStore.getState().notes.length).toBe(initialNotesCount + 1);

    const boardNote = useStore.getState().notes.find(n => n.id === pendingNote.id);
    expect(boardNote?.status).toBe('can'); // (20, 30) is 'can' quadrant
    expect(boardNote?.x).toBe(20);
    expect(boardNote?.y).toBe(30);

    // Move board note back to pending
    moveToPending(pendingNote.id);
    expect(useStore.getState().notes.length).toBe(initialNotesCount);
    expect(useStore.getState().pendingNotes.length).toBe(initialPendingCount + 1);
    expect(useStore.getState().pendingNotes.find(n => n.id === pendingNote.id)?.status).toBe('pending');
  });

  it('should handle multiple pending notes (batch add)', () => {
    const { addPendingNotes } = useStore.getState();
    const initialPendingCount = useStore.getState().pendingNotes.length;

    const newNotes = [
      { title: 'Batch Note 1', content: 'Content 1', category: 'health' as const },
      { title: 'Batch Note 2', content: 'Content 2', category: 'food' as const },
    ];

    addPendingNotes(newNotes);

    const pendingNotes = useStore.getState().pendingNotes;
    expect(pendingNotes.length).toBe(initialPendingCount + 2);
    expect(pendingNotes.some(n => n.title === 'Batch Note 1')).toBe(true);
    expect(pendingNotes.some(n => n.title === 'Batch Note 2')).toBe(true);
  });

  it('should merge two notes', () => {
    const { addNote, addPendingNote, mergeNotes } = useStore.getState();

    // Board note
    addNote('Target Note', 'Original Content', 'health', 'can');
    const targetNote = useStore.getState().notes.find(n => n.title === 'Target Note')!;

    // Pending note (source)
    addPendingNote('Source Note', 'Source Content', 'food');
    const sourceNote = useStore.getState().pendingNotes.find(n => n.title === 'Source Note')!;

    mergeNotes(sourceNote.id, targetNote.id);

    const updatedTarget = useStore.getState().notes.find(n => n.id === targetNote.id)!;
    expect(updatedTarget.content).toContain('Original Content');
    expect(updatedTarget.content).toContain('Source Content');
    expect(updatedTarget.content).toContain('Merged from: Source Note');

    // Source should be deleted
    expect(useStore.getState().pendingNotes.find(n => n.id === sourceNote.id)).toBeUndefined();
    expect(useStore.getState().notes.find(n => n.id === sourceNote.id)).toBeUndefined();
  });

  it('should add a note with authorName if logged in', () => {
    const { addNote } = useStore.getState();
    addNote('Auth Note', 'Content', 'health', 'can');

    const notes = useStore.getState().notes;
    const addedNote = notes[notes.length - 1];
    expect(addedNote.authorName).toBe('Test Author');
  });

  it('should update note content and authorName', () => {
    const { addNote, updateNoteContent } = useStore.getState();
    addNote('Initial Note', 'Initial Content', 'health', 'can');
    const noteId = useStore.getState().notes.slice(-1)[0].id;

    // 作者名を変更してモックを更新
    (useAuthStore.getState as any).mockReturnValue({
      currentUser: { name: 'Second Author' }
    });

    updateNoteContent(noteId, 'Updated Content');

    const updatedNote = useStore.getState().notes.find(n => n.id === noteId);
    expect(updatedNote?.content).toBe('Updated Content');
    expect(updatedNote?.authorName).toBe('Second Author');
  });

  it('should add a pending note with authorName', () => {
    (useAuthStore.getState as any).mockReturnValue({
      currentUser: { name: 'Pending Author' }
    });
    const { addPendingNote } = useStore.getState();

    addPendingNote('Pending Auth', 'Content', 'social');

    const addedNote = useStore.getState().pendingNotes[0];
    expect(addedNote.authorName).toBe('Pending Author');
  });

  it('should sync tasks and handle deduplication', async () => {
    const { syncTasks, addPendingNote } = useStore.getState();
    
    // すでに存在する googleTaskId を持つノートを追加
    addPendingNote('Existing Task', 'Content', 'house');
    const existingNote = useStore.getState().pendingNotes[0];
    useStore.setState({
      pendingNotes: [{ ...existingNote, googleTaskId: 'task-1' }]
    });

    // モックデータ: 1つは既存、1つは新規
    const mockTasks = [
      { googleTaskId: 'task-1', title: 'Task 1', notes: 'Notes 1', updated: '2024-01-01' },
      { googleTaskId: 'task-2', title: 'Task 2', notes: 'Notes 2', updated: '2024-01-02' },
    ];

    vi.mocked(tasksSyncService.fetchTasks).mockResolvedValue(mockTasks);

    await syncTasks();

    const pendingNotes = useStore.getState().pendingNotes;
    // 重複した 'task-1' は追加されず、'task-2' のみが追加されるはず
    expect(pendingNotes.some(n => n.googleTaskId === 'task-2')).toBe(true);
    expect(pendingNotes.filter(n => n.googleTaskId === 'task-1').length).toBe(1);
  });
});
