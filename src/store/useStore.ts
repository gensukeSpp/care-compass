import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { Category, QuadrantId, Note, History } from '../types/index';
import { getQuadrantFromPosition } from '../utils/positionUtils';
import { useAuthStore } from './useAuthStore';
import { tasksSyncService } from '../services/tasksSyncService';
import { supabase } from '../lib/supabase';

interface BoardState {
	notes: Note[];
	pendingNotes: Note[];
	selectedNoteId: string | null;
	containerDimensions: { width: number; height: number };
	isLoading: boolean;
	error: string | null;

	// Actions
	fetchNotes: (profileId: string) => Promise<void>;
	fetchNoteHistory: (noteId: string) => Promise<void>;
	selectNote: (id: string | null) => void;
	updateNoteContent: (id: string, content: string) => Promise<void>;
	addNote: (title: string, content: string, category: Category, status: QuadrantId) => Promise<void>;
	updateNote: (id: string, updates: Partial<Note>) => Promise<void>;
	deleteNote: (id: string) => Promise<void>;
	setContainerDimensions: (width: number, height: number) => void;
	updateNoteStatus: (id: string, newStatus: QuadrantId) => Promise<void>;
	updateNotePositionAndStatus: (id: string, x: number, y: number) => Promise<void>;

	// Add Form
	isAddFormOpen: boolean;
	draftContent: string;
	openAddForm: () => void;
	closeAddForm: () => void;
	setDraftContent: (content: string) => void;

	// Pending
	addPendingNote: (title: string, content: string, category: Category) => Promise<void>;
	addPendingNotes: (newNotes: { title: string; content: string; category: Category; googleTaskId?: string }[]) => Promise<void>;
	moveToPending: (id: string) => Promise<void>;
	moveToBoard: (id: string, x: number, y: number) => Promise<void>;
	mergeNotes: (sourceId: string, targetId: string) => Promise<void>;

	// Tasks
	syncTasks: () => Promise<void>;
}

export const useStore = create<BoardState>()(
	persist(
		(set, get) => ({
			notes: [],
			pendingNotes: [],
			selectedNoteId: null,
			containerDimensions: { width: 1024, height: 768 },
			isLoading: false,
			error: null,

			fetchNotes: async (profileId) => {
				set({ isLoading: true, error: null });
				try {
					const { data, error } = await supabase
						.from('sticky_notes')
						.select('*')
						.eq('profile_id', profileId)
						.order('created_at', { ascending: true });

					if (error) throw error;

					const allNotes = data as Note[];
					const notes: Note[] = [];
					const pendingNotes: Note[] = [];
					allNotes.forEach(n => {
						if (n.status === 'pending') pendingNotes.push(n);
						else notes.push(n);
					});
					set({ notes, pendingNotes, isLoading: false });
				} catch (err) {
					set({
						error: err instanceof Error ? err.message : '付箋の取得に失敗しました',
						isLoading: false
					});
				}
			},

			fetchNoteHistory: async (noteId: string) => {
				try {
					const { data, error } = await supabase
						.from('note_history')
						.select('*')
						.eq('note_id', noteId)
						.order('created_at', { ascending: false });

					if (error) throw error;

					const history = (data as { from_status: QuadrantId; to_status: QuadrantId; created_at: string; user_id: string }[]).map(h => ({
						id: '', // dummy
						note_id: noteId,
						user_id: h.user_id,
						from_status: h.from_status,
						to_status: h.to_status,
						created_at: h.created_at,
						from: h.from_status,
						to: h.to_status,
						timestamp: h.created_at
					})) as History[];

					set(state => ({
						notes: state.notes.map(n => n.id === noteId ? { ...n, history } : n),
						pendingNotes: state.pendingNotes.map(n => n.id === noteId ? { ...n, history } : n)
					}));
				} catch (err) {
					console.error('Failed to fetch note history:', err);
				}
			},

			selectNote: (id) => {
				set({ selectedNoteId: id });
				if (id) {
					get().fetchNoteHistory(id);
				}
			},

			setContainerDimensions: (width, height) =>
				set({ containerDimensions: { width, height } }),

			updateNoteContent: async (id, content) => {
				const { notes, pendingNotes } = get();
				const note = notes.find(n => n.id === id) || pendingNotes.find(n => n.id === id);
				if (!note) return;

				try {
					const { error } = await supabase
						.from('sticky_notes')
						.update({ content, updated_at: new Date().toISOString() })
						.eq('id', id);

					if (error) throw error;

					set({
						notes: notes.map(n => n.id === id ? { ...n, content } : n),
						pendingNotes: pendingNotes.map(n => n.id === id ? { ...n, content } : n)
					});
				} catch (err) {
					console.error('Failed to update note content:', err);
				}
			},

			addNote: async (title, content, category, status) => {
				const profile_id = useAuthStore.getState().currentProfileId;
				const author_id = useAuthStore.getState().currentUser?.id;
				if (!profile_id) return;

				let x = 5, y = 5;
				switch (status) {
					case 'can': x = 5; y = 5; break;
					case 'cannot': x = 55; y = 5; break;
					case 'risk': x = 5; y = 55; break;
					case 'request': x = 55; y = 55; break;
					case 'pending': x = 0; y = 0; break;
				}

				try {
					const { data, error } = await supabase
						.from('sticky_notes')
						.insert([{
							profile_id,
							title,
							content,
							category,
							status,
							x,
							y,
							author_id
						}])
						.select()
						.single();

					if (error) throw error;

					const newNote = data as Note;
					if (status === 'pending') {
						set(state => ({ pendingNotes: [newNote, ...state.pendingNotes] }));
					} else {
						set(state => ({ notes: [...state.notes, newNote] }));
					}
				} catch (err) {
					console.error('Failed to add note:', err);
				}
			},

			addPendingNote: async (title, content, category) => {
				const { addNote } = get();
				await addNote(title, content, category, 'pending');
			},

			addPendingNotes: async (newNotes) => {
				const profile_id = useAuthStore.getState().currentProfileId;
				const author_id = useAuthStore.getState().currentUser?.id;
				if (!profile_id) return;

				const notesToInsert = newNotes.map(n => ({
					profile_id,
					title: n.title,
					content: n.content,
					category: n.category,
					status: 'pending' as QuadrantId,
					x: 0,
					y: 0,
					author_id,
					google_task_id: n.googleTaskId
				}));

				try {
					const { data, error } = await supabase
						.from('sticky_notes')
						.insert(notesToInsert)
						.select();

					if (error) throw error;

					set(state => ({
						pendingNotes: [...(data as Note[]), ...state.pendingNotes]
					}));
				} catch (err) {
					console.error('Failed to add pending notes:', err);
				}
			},

			updateNote: async (id, updates) => {
				try {
					const dbUpdates: Record<string, unknown> = { ...updates };
					// UI専用フィールドを除去
					delete dbUpdates.history;
					delete dbUpdates.authorName;
					delete dbUpdates.updatedAt;

					// Map UI fields to DB fields if necessary
					if (updates.googleTaskId) {
						dbUpdates.google_task_id = updates.googleTaskId;
						delete dbUpdates.googleTaskId;
					}

					const { error } = await supabase
						.from('sticky_notes')
						.update({ ...dbUpdates, updated_at: new Date().toISOString() })
						.eq('id', id);

					if (error) throw error;

					set(state => ({
						notes: state.notes.map(n => n.id === id ? { ...n, ...updates } : n),
						pendingNotes: state.pendingNotes.map(n => n.id === id ? { ...n, ...updates } : n)
					}));
				} catch (err) {
					console.error('Failed to update note:', err);
				}
			},

			deleteNote: async (id) => {
				try {
					const { error } = await supabase
						.from('sticky_notes')
						.delete()
						.eq('id', id);

					if (error) throw error;

					set(state => ({
						notes: state.notes.filter(n => n.id !== id),
						pendingNotes: state.pendingNotes.filter(n => n.id !== id),
						selectedNoteId: state.selectedNoteId === id ? null : state.selectedNoteId
					}));
				} catch (err) {
					console.error('Failed to delete note:', err);
				}
			},

			updateNoteStatus: async (id, newStatus) => {
				const { notes, pendingNotes } = get();
				const note = notes.find(n => n.id === id) || pendingNotes.find(n => n.id === id);
				if (!note || note.status === newStatus) return;

				try {
					const { error } = await supabase.rpc('pending_to_new_status', {
						note_id: id,
						new_status: newStatus,
					});

					if (error) throw error;

					const updatedNote = { ...note, status: newStatus };

					if (newStatus === 'pending') {
						set({
							notes: notes.filter(n => n.id !== id),
							pendingNotes: [updatedNote, ...pendingNotes.filter(n => n.id !== id)]
						});
					} else {
						set({
							notes: [...notes.filter(n => n.id !== id), updatedNote],
							pendingNotes: pendingNotes.filter(n => n.id !== id)
						});
					}
				} catch (err) {
					console.error('Failed to update note status:', err);
				}
			},

			updateNotePositionAndStatus: async (id, x, y) => {
				const { notes } = get();
				const note = notes.find(n => n.id === id);
				if (!note) return;

				const newStatus = getQuadrantFromPosition(x, y);
				const statusChanged = note.status !== newStatus;

				try {
					const updateData: Record<string, unknown> = { x, y, updated_at: new Date().toISOString() };
					if (statusChanged) {
						updateData.status = newStatus;
					}

					const { error } = await supabase.rpc('update_note_position_status', {
						note_id: id,
						moved_x: x,
						moved_y: y,
						new_status: newStatus
					});

					if (error) throw error;

					const updatedNote = { ...note, x, y, status: newStatus };
					set({
						notes: notes.map(n => n.id === id ? updatedNote : n)
					});
				} catch (err) {
					console.error('Failed to update note position:', err);
				}
			},

			moveToPending: async (id) => {
				const { updateNoteStatus } = get();
				await updateNoteStatus(id, 'pending');
			},

			moveToBoard: async (id, x, y) => {
				const { notes, pendingNotes } = get();
				const note = pendingNotes.find(n => n.id === id) || notes.find(n => n.id === id);
				if (!note) return;

				const newStatus = getQuadrantFromPosition(x, y);
				const user_id = useAuthStore.getState().currentUser?.id;

				try {
					const { error: noteError } = await supabase
						.from('sticky_notes')
						.update({ x, y, status: newStatus, updated_at: new Date().toISOString() })
						.eq('id', id);

					if (noteError) throw noteError;

					if (user_id) {
						await supabase
							.from('note_history')
							.insert([{
								note_id: id,
								from_status: note.status,
								to_status: newStatus,
								user_id
							}]);
					}

					const updatedNote = { ...note, x, y, status: newStatus };
					set({
						notes: [...notes.filter(n => n.id !== id), updatedNote],
						pendingNotes: pendingNotes.filter(n => n.id !== id)
					});
				} catch (err) {
					console.error('Failed to move note to board:', err);
				}
			},

			mergeNotes: async (sourceId, targetId) => {
				const { notes, pendingNotes } = get();
				if (sourceId === targetId) return;

				const source = notes.find(n => n.id === sourceId) || pendingNotes.find(n => n.id === sourceId);
				const target = notes.find(n => n.id === targetId) || pendingNotes.find(n => n.id === targetId);

				if (!source || !target) return;

				const mergedContent = `${target.content}\n\n---\n**Merged from: ${source.title}** (${new Date().toISOString()})\n${source.content}`;

				try {
					// Update target
					// const { error: updateError } = await supabase
					// 	.from('sticky_notes')
					// 	.update({ content: mergedContent, updated_at: new Date().toISOString() })
					// 	.eq('id', targetId);

					// if (updateError) throw updateError;

					// Delete source
					// const { error: deleteError } = await supabase
					// 	.from('sticky_notes')
					// 	.delete()
					// 	.eq('id', sourceId);

					// if (deleteError) throw deleteError;
					const { error } = await supabase.rpc('merge_sticky_notes', {
						source_id: sourceId,
						target_id: targetId
					});

					if (error) throw error;

					// Log history for target if needed (optional, depends on design)

					const updatedTarget = { ...target, content: mergedContent };

					set(state => ({
						notes: state.notes.map(n => n.id === targetId ? updatedTarget : n).filter(n => n.id !== sourceId),
						pendingNotes: state.pendingNotes.map(n => n.id === targetId ? updatedTarget : n).filter(n => n.id !== sourceId),
						selectedNoteId: state.selectedNoteId === sourceId ? targetId : state.selectedNoteId
					}));
				} catch (err) {
					console.error('Failed to merge notes:', err);
				}
			},

			syncTasks: async () => {
				const { addPendingNotes, notes, pendingNotes } = get();
				try {
					const tasks = await tasksSyncService.fetchTasks();
					const existingGoogleTaskIds = new Set([
						...notes.map(n => n.google_task_id || n.googleTaskId).filter(Boolean),
						...pendingNotes.map(n => n.google_task_id || n.googleTaskId).filter(Boolean)
					]);

					const newTasks = tasks.filter(task => !existingGoogleTaskIds.has(task.googleTaskId));
					if (newTasks.length === 0) return;

					await addPendingNotes(newTasks.map(task => ({
						title: task.title,
						content: task.notes,
						category: 'house',
						googleTaskId: task.googleTaskId
					})));
				} catch (error) {
					console.error('Failed to sync tasks:', error);
					throw error;
				}
			},

			isAddFormOpen: false,
			draftContent: '',
			openAddForm: () => set({ isAddFormOpen: true }),
			closeAddForm: () => set({ isAddFormOpen: false, draftContent: '' }),
			setDraftContent: (content) => set({ draftContent: content }),
		}),
		{
			name: 'care-board-storage',
			version: 2,
			partialize: (state) => ({
				containerDimensions: state.containerDimensions,
				// notes and pendingNotes are no longer persisted
			}),
		}
	)
);
