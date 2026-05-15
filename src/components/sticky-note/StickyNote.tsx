import { useDraggable, useDroppable } from '@dnd-kit/core';

import { useStore } from '../../store/useStore';
import { type Category } from '../../types/index';
import { percentageToPixels } from '../../utils/positionUtils';
import { StickyNoteView } from './StickyNoteView';

export const StickyNote = ({ id, title, x, y, category }: { id: string, title: string, x: number, y: number, category: Category }) => {
	const selectNote = useStore((state) => state.selectNote);
	const containerDimensions = useStore((state) => state.containerDimensions);
	const { attributes, listeners, setNodeRef: setDraggableRef, transform, isDragging } = useDraggable({ 
		id,
		data: {
			type: 'board-note',
			id,
			title,
			category
		}
	});
	const { setNodeRef: setDroppableRef, isOver } = useDroppable({ id });

	// %座標をpxに変換
	const pxX = percentageToPixels(x, containerDimensions.width);
	const pxY = percentageToPixels(y, containerDimensions.height);

	// ドラッグ中の位置計算 (DragOverlayを使用しているため、オリジナルは元の位置に留めつつ非表示にする)
	// transformの代わりにleft/topを使用することで、dnd-kitの初回計測をより安定させる
	const style = {
		left: `${pxX}px`,
		top: `${pxY}px`,
		position: 'absolute' as const,
		zIndex: isDragging ? 50 : 1,
		opacity: isDragging ? 0 : 1,
		touchAction: 'none' as const,
	};

	const handlePointerUp = () => {
		// ドラッグとクリックを判別するため、微細な移動ならクリックとみなす
		if (!transform || (Math.abs(transform.x) < 5 && Math.abs(transform.y) < 5)) {
			selectNote(id);
		}
	};

	return (
		<div
			ref={(node) => {
				setDraggableRef(node);
				setDroppableRef(node);
			}}
			style={style}
			{...listeners}
			{...attributes}
			onPointerUp={() => handlePointerUp()}
			className={`cursor-grab active:cursor-grabbing`}
		>
			<StickyNoteView 
				title={title} 
				category={category} 
				isDragging={isDragging} 
				isOver={isOver}
			/>
		</div>
	);
};
