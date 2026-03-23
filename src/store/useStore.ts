import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid'; // npm install uuid

import type { Category, QuadrantId } from '../types/index';

interface Note {
	id: string;
	title: string;
	category: Category;
	// quadrant: QuadrantId;
	content: string; // Markdown形式
	x: number;
	y: number;
}

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

export const useStore = create<BoardState>()(
	persist(
		(set) => ({
			notes: [
				{ id: '1', title: '散歩', category: 'health', content: 'AM11:00に毎日の習慣として', x: 50, y: 50 },
				{ id: '2', title: '火の不始末', category: 'house', content: 'コンロの消し忘れに注意', x: 300, y: 300 },
				{ id: '3', title: '買い物', category: 'food', content: '# 今日の様子\n足取りは軽いが、**段差**に注意が必要。', x: 400, y: 150 },
			],
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
						{
							id: uuidv4(),
							title,
							content,
							category,
							x: 20, // 象限内の初期位置
							y: 20,
							updatedAt: new Date().toISOString(),
						},
					],
				})),
			updateNote: (id, updates) =>
				set((state) => ({
					notes: state.notes.map((n) => (n.id === id ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n)),
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
