import { useDraggable } from '@dnd-kit/core';

import { useStore } from '../../store/useStore';
import { type Category } from '../../types/index';

const categoryColors: Record<Category, string> = {
	house: 'bg-blue-100 border-blue-300',
	food: 'bg-orange-100 border-orange-300',
	health: 'bg-green-100 border-green-300',
	medical: 'bg-red-100 border-red-300',
	social: 'bg-purple-100 border-purple-300',
};

export const StickyNote = ({ id, title, x, y, category }: { id: string, title: string, x: number, y: number, category: Category }) => {
	const selectNote = useStore((state) => state.selectNote);
	console.log(`${selectNote}`);
	const { attributes, listeners, setNodeRef, transform } = useDraggable({ id });

	// ドラッグ中の位置計算
	const style = {
		transform: transform
			? `translate3d(${transform.x + x}px, ${transform.y + y}px, 0)`
			: `translate3d(${x}px, ${y}px, 0)`,
		position: 'absolute' as const,
	};

	// const handlePointerDown = (e: React.PointerEvent) => {
	// 	// ドラッグとクリックを判別するため、微細な移動ならクリックとみなす
	// 	// 簡易的にはそのまま onClick でも動きますが、dnd-kit の listeners と干渉しないよう調整
	// };

	console.log(`カテゴリー: ${category}`);
	const colorClass = categoryColors[category] || 'bg-yellow-100 border-yellow-300';

	return (
		<div
			ref={setNodeRef}
			style={style}
			{...listeners}
			{...attributes}
			onClick={() => selectNote(id)} // ここでストアの選択状態を更新
			className={`${colorClass} w-32 h-20 p-2 shadow-md cursor-grab active:cursor-grabbing rounded border text-sm overflow-hidden`}
		>
			{title}
		</div>
	);
};