import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';

import type { Category, QuadrantId, Note } from '../types/index';
import { getQuadrantFromPosition } from '../utils/positionUtils';
import { INITIAL_NOTE, INITIAL_PENDING_NOTES } from './initialData';
import { useAuthStore } from './useAuthStore';
import { tasksSyncService } from '../services/tasksSyncService';

interface BoardState {
	notes: Note[];
	selectedNoteId: string | null;
	containerDimensions: { width: number; height: number };
	selectNote: (id: string | null) => void;
	updateNoteContent: (id: string, content: string) => void;
	addNote: (title: string, content: string, category: Category, status: QuadrantId) => void;
	updateNote: (id: string, updates: Partial<Note>) => void;
	deleteNote: (id: string) => void;
	setContainerDimensions: (width: number, height: number) => void;
	updateNoteStatus: (id: string, newStatus: QuadrantId) => void;
	updateNotePositionAndStatus: (id: string, x: number, y: number) => void;
	// 「ファイルから読み込んだ一時的な内容」を管理する状態を追加
	isAddFormOpen: boolean;
	draftContent: string;
	openAddForm: () => void;
	closeAddForm: () => void;
	setDraftContent: (content: string) => void;
	// Pending
	pendingNotes: Note[]; // 追加
	addPendingNote: (title: string, content: string, category: Category) => void; // 追加
	addPendingNotes: (newNotes: { title: string; content: string; category: Category }[]) => void; // 追加
	moveToPending: (id: string) => void; // 追加
	moveToBoard: (id: string, x: number, y: number) => void; // 追加
	mergeNotes: (sourceId: string, targetId: string) => void; // 追加
	syncTasks: () => Promise<void>; // 追加
}

function createNote(title: string, content: string, category: Category, status: QuadrantId, authorName?: string, googleTaskId?: string): Note {
	let x = 5;
	let y = 5;

	switch (status) {
		case 'can':
			x = 5; y = 5; break;
		case 'cannot':
			x = 55; y = 5; break;
		case 'risk':
			x = 5; y = 55; break;
		case 'request':
			x = 55; y = 55; break;
		case 'pending':
			x = 0; y = 0; break; // drawer内では座標は不要
		default:
			x = 40; y = 40; // central area for neutral
	}

	return {
		id: uuidv4(),
		title,
		content,
		category,
		status,
		authorName,
		googleTaskId,
		x,
		y,
		updatedAt: new Date().toISOString(),
		history: [],
	};
}
export const useStore = create<BoardState>()(
	persist(
		(set) => ({
			notes: INITIAL_NOTE,
			pendingNotes: INITIAL_PENDING_NOTES, // 初期データをセット
			selectedNoteId: null,
			containerDimensions: { width: 1024, height: 768 }, // デフォルト値
			selectNote: (id) => set({ selectedNoteId: id }),
			setContainerDimensions: (width, height) =>
				set({ containerDimensions: { width, height } }),
			updateNoteContent: (id, content) =>
				set((state) => {
					// notes か pendingNotes のどちらかにあるか探して更新
					const isInNotes = state.notes.some(n => n.id === id);
					const authorName = useAuthStore.getState().currentUser?.name;
					if (isInNotes) {
						return {
							notes: state.notes.map((n) => (n.id === id ? { ...n, content, authorName } : n))
						};
					} else {
						return {
							pendingNotes: state.pendingNotes.map((n) => (n.id === id ? { ...n, content, authorName } : n))
						};
					}
				}),
			addNote: (title, content, category, status) =>
				set((state) => {
					const authorName = useAuthStore.getState().currentUser?.name;
					const newNote = createNote(title, content, category, status, authorName);
					if (status === 'pending') {
						return {
							pendingNotes: [newNote, ...state.pendingNotes]
						};
					} else {
						return {
							notes: [...state.notes, newNote]
						};
					}
				}),
			addPendingNote: (title, content, category) =>
				set((state) => {
					const authorName = useAuthStore.getState().currentUser?.name;
					return {
						pendingNotes: [
							createNote(title, content, category, 'pending', authorName),
							...state.pendingNotes
						],
					};
				}),
			addPendingNotes: (newNotes) =>
				set((state) => {
					const authorName = useAuthStore.getState().currentUser?.name;
					return {
						pendingNotes: [
							...newNotes.map(n => createNote(n.title, n.content, n.category, 'pending', authorName)),
							...state.pendingNotes
						],
					};
				}),
			updateNote: (id, updates) =>
				set((state) => {
					const isInNotes = state.notes.some(n => n.id === id);
					if (isInNotes) {
						return {
							notes: state.notes.map((n) => (n.id === id ? { ...n, ...updates } : n)),
						};
					} else {
						return {
							pendingNotes: state.pendingNotes.map((n) => (n.id === id ? { ...n, ...updates } : n)),
						};
					}
				}),
			deleteNote: (id) =>
				set((state) => ({
					notes: state.notes.filter((n) => n.id !== id),
					pendingNotes: state.pendingNotes.filter((n) => n.id !== id),
					selectedNoteId: state.selectedNoteId === id ? null : state.selectedNoteId, // 開いていたら閉じる
				})),
			updateNoteStatus: (id, newStatus) =>
				set((state) => {
					// 両方の配列から探す
					const note = state.notes.find((n) => n.id === id) || state.pendingNotes.find(n => n.id === id);
					if (!note || note.status === newStatus) return state;

					const newHistoryEntry = {
						from: note.status,
						to: newStatus,
						timestamp: new Date().toISOString(),
					};

					const updatedNote = {
						...note,
						status: newStatus,
						history: [...(note.history || []), newHistoryEntry],
					};

					// 状態が変わった時に配列間を移動させるべきか検討
					// status が 'pending' かどうかで所属配列を決める
					if (newStatus === 'pending') {
						return {
							notes: state.notes.filter(n => n.id !== id),
							pendingNotes: [updatedNote, ...state.pendingNotes.filter(n => n.id !== id)]
						};
					} else {
						return {
							notes: [...state.notes.filter(n => n.id !== id), updatedNote],
							pendingNotes: state.pendingNotes.filter(n => n.id !== id)
						};
					}
				}),
			updateNotePositionAndStatus: (id, x, y) =>
				set((state) => {
					// 座標更新は基本 board上のノートが対象
					const note = state.notes.find(n => n.id === id);
					if (!note) return state;

					const newStatus = getQuadrantFromPosition(x, y);
					const statusChanged = note.status !== newStatus;

					if (!statusChanged) {
						return {
							notes: state.notes.map(n => n.id === id ? { ...n, x, y } : n)
						};
					}

					const newHistoryEntry = {
						from: note.status,
						to: newStatus,
						timestamp: new Date().toISOString(),
					};

					const updatedNote = {
						...note,
						x,
						y,
						status: newStatus,
						history: [...(note.history || []), newHistoryEntry],
					};

					// board内での status変更（象限移動）
					// 'pending' になることは getQuadrantFromPosition の仕様上ないはずだが、汎用性のために一応
					if (newStatus === 'pending') {
						return {
							notes: state.notes.filter(n => n.id !== id),
							pendingNotes: [...state.pendingNotes.filter(n => n.id !== id), updatedNote]
						};
					} else {
						return {
							notes: state.notes.map(n => n.id === id ? updatedNote : n)
						};
					}
				}),
			moveToPending: (id) => {
				const { updateNoteStatus } = useStore.getState();
				updateNoteStatus(id, 'pending');
			},
			moveToBoard: (id, x, y) => {
				set((state) => {
					const note = state.pendingNotes.find(n => n.id === id) || state.notes.find(n => n.id === id);
					if (!note) return state;

					const newStatus = getQuadrantFromPosition(x, y);
					const newHistoryEntry = {
						from: note.status,
						to: newStatus,
						timestamp: new Date().toISOString(),
					};

					const updatedNote = {
						...note,
						x,
						y,
						status: newStatus,
						history: [...(note.history || []), newHistoryEntry],
					};

					return {
						notes: [...state.notes.filter(n => n.id !== id), updatedNote],
						pendingNotes: state.pendingNotes.filter(n => n.id !== id)
					};
				});
			},
			mergeNotes: (sourceId, targetId) => {
				set((state) => {
					if (sourceId === targetId) return state;

					const source = state.notes.find(n => n.id === sourceId) || state.pendingNotes.find(n => n.id === sourceId);
					const target = state.notes.find(n => n.id === targetId) || state.pendingNotes.find(n => n.id === targetId);

					if (!source || !target) return state;

					// 内容を追記
					// データのポータビリティと一貫性のために、ISO 8601 形式（toISOString()）
					const mergedContent = `${target.content}\n\n---\n**Merged from: ${source.title}** (${new Date().toISOString()})\n${source.content}`;

					const newHistoryEntry = {
						from: source.status,
						to: target.status,
						timestamp: new Date().toISOString(),
					};

					const updatedTarget = {
						...target,
						content: mergedContent,
						updatedAt: new Date().toISOString(),
						history: [...(target.history || []), newHistoryEntry]
					};

					// 両方の配列をクリーンアップ
					return {
						notes: state.notes.map(n => n.id === targetId ? updatedTarget : n).filter(n => n.id !== sourceId),
						pendingNotes: state.pendingNotes.map(n => n.id === targetId ? updatedTarget : n).filter(n => n.id !== sourceId),
						selectedNoteId: state.selectedNoteId === sourceId ? targetId : state.selectedNoteId
					};
				});
			},
			syncTasks: async () => {
				const { pendingNotes, notes } = useStore.getState();
				const authorName = useAuthStore.getState().currentUser?.name;

				try {
					const tasks = await tasksSyncService.fetchTasks();
					
					// 重複排除: すでに notes または pendingNotes に存在する googleTaskId を除外
					const existingGoogleTaskIds = new Set([
						...notes.map(n => n.googleTaskId).filter(Boolean),
						...pendingNotes.map(n => n.googleTaskId).filter(Boolean)
					]);

					const newTasks = tasks.filter(task => !existingGoogleTaskIds.has(task.googleTaskId));

					if (newTasks.length === 0) return;

					const newNotes = newTasks.map(task => 
						createNote(task.title, task.notes, 'house', 'pending', authorName, task.googleTaskId)
					);

					set((state) => ({
						pendingNotes: [...newNotes, ...state.pendingNotes]
					}));
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
			version: 1, // バージョンを上げる
			migrate: (persistedState: any, version: number) => {
				if (version === 0) {
					// バージョン0（以前の状態）から移行する場合、
					// pendingNotes が空、または存在しないなら初期データを注入する
					return {
						...persistedState,
						pendingNotes: (persistedState.pendingNotes && persistedState.pendingNotes.length > 0)
							? persistedState.pendingNotes
							: INITIAL_PENDING_NOTES
					};
				}
				return persistedState as BoardState;
			}
		}
	)
);
