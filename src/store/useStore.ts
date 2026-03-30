import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';

import type { Category, QuadrantId, Note } from '../types/index';
import { INITIAL_NOTE } from './initialData';

interface BoardState {
	notes: Note[];
	selectedNoteId: string | null;
	containerDimensions: { width: number; height: number }; // 追加
	selectNote: (id: string | null) => void;
	updateNotePosition: (id: string, x: number, y: number) => void;
	updateNoteContent: (id: string, content: string) => void;
	addNote: (title: string, content: string, category: Category, status: QuadrantId) => void;
	updateNote: (id: string, updates: Partial<Note>) => void;
	deleteNote: (id: string) => void;
	setContainerDimensions: (width: number, height: number) => void; // 追加
	updateNoteStatus: (id: string, newStatus: QuadrantId) => void;
}

function createNote(title: string, content: string, category: Category, status: QuadrantId): Note {
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
		default:
			x = 40; y = 40; // central area for neutral
	}

	return {
		id: uuidv4(),
		title,
		content,
		category,
		status,
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
			selectedNoteId: null,
			containerDimensions: { width: 1024, height: 768 }, // デフォルト値
			selectNote: (id) => set({ selectedNoteId: id }),
			updateNotePosition: (id, x, y) =>
				set((state) => ({
					notes: state.notes.map((n) => (n.id === id ? { ...n, x, y } : n)),
				})),
			setContainerDimensions: (width, height) =>
				set({ containerDimensions: { width, height } }),
			updateNoteContent: (id, content) =>
				set((state) => ({
					notes: state.notes.map((n) => (n.id === id ? { ...n, content } : n))
				})),
			addNote: (title, content, category, status) =>
				set((state) => ({
					notes: [
						...state.notes,
						createNote(title, content, category, status)
					],
				})),
			updateNote: (id, updates) =>
				set((state) => ({
					notes: state.notes.map((n) => (n.id === id ? { ...n, ...updates } : n)),
				})),
			deleteNote: (id) =>
				set((state) => ({
					notes: state.notes.filter((n) => n.id !== id),
					selectedNoteId: state.selectedNoteId === id ? null : state.selectedNoteId, // 開いていたら閉じる
				})),
			updateNoteStatus: (id, newStatus) =>
				set((state) => {
					const note = state.notes.find((n) => n.id === id);
					if (!note || note.status === newStatus) return state;

					const newHistoryEntry = {
						from: note.status,
						to: newStatus,
						timestamp: new Date().toISOString(),
					};

					return {
						notes: state.notes.map((n) =>
							n.id === id
								? {
									...n,
									status: newStatus,
									history: [...(n.history || []), newHistoryEntry],
								}
								: n
						),
					};
				}),
		}),
		{ name: 'care-board-storage' } // LocalStorageに自動保存される
	)
);
