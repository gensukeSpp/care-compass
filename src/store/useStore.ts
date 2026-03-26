import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';

import type { Category, Note } from '../types/index';
import { INITIAL_NOTE } from './initialData';

interface BoardState {
	notes: Note[];
	selectedNoteId: string | null; // 追加
	selectNote: (id: string | null) => void; // 追加
	updateNotePosition: (id: string, x: number, y: number) => void;
	updateNoteContent: (id: string, content: string) => void; // 追記用
	addNote: (title: string, content: string, category: Category) => void;
	updateNote: (id: string, updates: Partial<Note>) => void;
	deleteNote: (id: string) => void;
}

function createNote(title: string, content: string, category: Category): Note {
	return {
		id: uuidv4(),
		title,
		content,
		category,
		x: 20, // 象限内の初期位置
		y: 20,
		updatedAt: new Date().toISOString(),
	};
}
export const useStore = create<BoardState>()(
	persist(
		(set) => ({
			notes: INITIAL_NOTE,
			selectedNoteId: null,
			selectNote: (id) => set({ selectedNoteId: id }),
			updateNotePosition: (id, x, y) =>
				set((state) => ({
					notes: state.notes.map((n) => (n.id === id ? { ...n, x, y } : n)),
				})),
			updateNoteContent: (id, content) =>
				set((state) => ({
					notes: state.notes.map((n) => (n.id === id ? { ...n, content } : n))
				})),
			addNote: (title, content, category) =>
				set((state) => ({
					notes: [
						...state.notes,
						createNote(title, content, category)
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
		}),
		{ name: 'care-board-storage' } // LocalStorageに自動保存される
	)
);
