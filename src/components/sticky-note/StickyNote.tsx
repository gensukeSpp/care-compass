import { useDraggable } from '@dnd-kit/core';

import { useStore } from '../../store/useStore';
import { type Category } from '../../types/index';
import { percentageToPixels } from '../../utils/positionUtils';

const categoryColors: Record<Category, string> = {
	house: 'bg-blue-100 border-blue-300',
	food: 'bg-orange-100 border-orange-300',
	health: 'bg-green-100 border-green-300',
	medical: 'bg-red-100 border-red-300',
	social: 'bg-purple-100 border-purple-300',
};

export const StickyNote = ({ id, title, x, y, category }: { id: string, title: string, x: number, y: number, category: Category }) => {
	const selectNote = useStore((state) => state.selectNote);
	const containerDimensions = useStore((state) => state.containerDimensions);
	const { attributes, listeners, setNodeRef, transform } = useDraggable({ id });

	// %座標をpxに変換
	const pxX = percentageToPixels(x, containerDimensions.width);
	const pxY = percentageToPixels(y, containerDimensions.height);

	// ドラッグ中の位置計算
	const style = {
		transform: transform
			? `translate3d(${transform.x + pxX}px, ${transform.y + pxY}px, 0)`
			: `translate3d(${pxX}px, ${pxY}px, 0)`,
		position: 'absolute' as const,
	};

	const handlePointerUp = (e: React.PointerEvent) => {
		console.log(`pointer-event: ${e.currentTarget}`);
		// ドラッグとクリックを判別するため、微細な移動ならクリックとみなす
		/**
		 - listeners によって pointerdown → pointermove の変位を検出してドラッグ開始
		 - pointerup でドラッグ終了
		 - click イベントは発火しない（または dnd-kit がキャンセルしている）
		 */
		// !transform で確実にドラッグ終了を検出
		if (!transform || (Math.abs(transform.x) < 5 && Math.abs(transform.y) < 5)) {
			// if (Math.abs(e.movementX) < 5 && Math.abs(e.movementY) < 5) { は(0, 0)で反応するので、ドラッグは常に0
			// if (e.button === 0) { // 左クリックのみ選択とみなす
			selectNote(id);
			// e.movementX, e.movementY == 0 のときのみ反応
			console.log(`${id}: ${style.transform} の移動と判断`);
		}
	};

	const colorClass = categoryColors[category] || 'bg-yellow-100 border-yellow-300';

	return (
		<div
			ref={setNodeRef}
			style={style}
			{...listeners}
			{...attributes}
			onPointerUp={(e) => handlePointerUp(e)} // ここでストアの選択状態を更新
			/**
			 * 
				1. dnd-kit が pointer events を制御している最中に
				2. React の onClick ハンドラが listener chain に追加される
				3. pointer event capture が競合 → ドラッグ検出が破綻する可能性
				4. または dnd-kit が preventDefault() していることで click が発火しない
				つまり、onClick は dnd-kit の pointer 制御と相互干渉する。
			 */
			// onClick={handleClick}
			className={`${colorClass} w-32 h-20 p-2 shadow-md cursor-grab active:cursor-grabbing rounded border text-sm overflow-hidden`}
		>
			{title}
		</div>
	);
};