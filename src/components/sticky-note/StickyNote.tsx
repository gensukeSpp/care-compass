import { useCallback, useState } from 'react';

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
	// const [isDragging, setIsDragging] = useState(false);
	const { attributes, listeners, setNodeRef, transform } = useDraggable({ id });

	// ドラッグ中の位置計算
	const style = {
		transform: transform
			? `translate3d(${transform.x + x}px, ${transform.y + y}px, 0)`
			: `translate3d(${x}px, ${y}px, 0)`,
		position: 'absolute' as const,
	};

	// 🙅isDragging と transform の状態タイミングズレ
	// const isDrag = Boolean(transform);
	const handlePointerUp = (e: React.PointerEvent) => {
		console.log(`pointer-event: ${e.currentTarget}`);
		// ドラッグとクリックを判別するため、微細な移動ならクリックとみなす
		/**
		 * 🙅簡易的にはそのまま onClick でも動きますが、dnd-kit の listeners と干渉しないよう調整
		 - listeners によって pointerdown → pointermove の変位を検出してドラッグ開始
		 - pointerup でドラッグ終了
		 - click イベントは発火しない（または dnd-kit がキャンセルしている）
		 */
		// 
		// !transform で確実にドラッグ終了を検出
		if (!transform || (Math.abs(transform.x) < 5 && Math.abs(transform.y) < 5)) {
			// if (Math.abs(e.movementX) < 5 && Math.abs(e.movementY) < 5) {
			// if (e.button === 0) { // 左クリックのみ選択とみなす
			selectNote(id);
			// e.movementX, e.movementY == 0 のときのみ反応
			console.log(`${id}: ${style.transform} の移動と判断`);
		}
		// transform との重複
		// setIsDragging(false); // ← ドラッグ終了時にリセット
	};

	// どういうわけかこれが無いとエラーになる。中身は反応しない(useCallback 必須)↙
	/**
	 * 💡 なぜ onClick={openNoteDetail} が “治った”ように見えるか
			onClickがあるとイベントフローと再レンダリングタイミングが変わり、
			たまたまダメージを受けないケースになるだけ
	 */
	// const openNoteDetail = useCallback((e: React.MouseEvent) => {
	// 	console.log(`mouse-event: ${e.currentTarget}`);
	// 	// ここでノートの詳細表示を開く処理を実装
	// 	console.log(`ノート ${id} の詳細を表示`);
	// 	// selectNote(id);
	// }, []);
	// const handleClick = () => {
	// 	if (!isDragging) {
	// 		selectNote(id);
	// 		// 詳細開く処理
	// 		console.log(`ノート ${id} の詳細を表示`);
	// 	}
	// };

	const colorClass = categoryColors[category] || 'bg-yellow-100 border-yellow-300';

	return (
		<div
			ref={setNodeRef}
			style={style}
			{...listeners}
			{...attributes}
			// onPointerDown={() => setIsDragging(false)}
			// onPointerMove={() => setIsDragging(true)}
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