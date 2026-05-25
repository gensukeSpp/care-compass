import { useDraggable, useDroppable } from '@dnd-kit/core';

import { useStore } from '../../store/useStore';
import { type Category } from '../../types/index';
import { StickyNoteView } from './StickyNoteView';

export const StickyNote = ({ id, title, x, y, category }: { id: string, title: string, x: number, y: number, category: Category }) => {
	const selectNote = useStore((state) => state.selectNote);
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

	// %座標をそのままCSSに使用し、transform: translate(-50%, -50%) で中心を合わせる
	// clamp を使用して、付箋の端がボードからはみ出さないように調整 (w-32=8rem, h-20=5rem)
	const style = {
		left: `clamp(4rem, ${x}%, calc(100% - 4rem))`,
		top: `clamp(2.5rem, ${y}%, calc(100% - 2.5rem))`,
		transform: 'translate(-50%, -50%)',
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
