import { type Category } from '../../types/index';

const categoryColors: Record<Category, string> = {
  house: 'bg-blue-100 border-blue-300',
  food: 'bg-orange-100 border-orange-300',
  health: 'bg-green-100 border-green-300',
  medical: 'bg-red-100 border-red-300',
  social: 'bg-purple-100 border-purple-300',
};

const categoryEmojis: Record<Category, string> = {
  house: '🏠',
  food: '🍱',
  health: '💪',
  medical: '💊',
  social: '🧑‍🤝‍🧑',
};

interface StickyNoteViewProps {
  title: string;
  category: Category;
  isDragging?: boolean;
  isOverlay?: boolean;
  isOver?: boolean;
}

export const StickyNoteView = ({ title, category, isDragging, isOverlay, isOver }: StickyNoteViewProps) => {
  const colorClass = categoryColors[category] || 'bg-yellow-100 border-yellow-300';
  const emoji = categoryEmojis[category] || '🗒️';

  // マージ可能な状態でホバーされた時のスタイル
  const hoverStyle = isOver ? 'ring-4 ring-blue-400 ring-opacity-50 scale-105 z-20' : '';
  const draggingStyle = isDragging && !isOverlay ? 'opacity-0' : '';
  const overlayStyle = isOverlay ? 'shadow-2xl scale-110 z-[1000] rotate-2 pointer-events-none opacity-90' : '';

  return (
    <div
      className={`${colorClass} ${hoverStyle} ${draggingStyle} ${overlayStyle} w-32 h-20 p-2 shadow-md rounded border text-sm overflow-hidden transition-all duration-200 flex flex-col`}
    >
      <div className="flex items-center gap-1 mb-1">
        <span className="text-xs">{emoji}</span>
        <div className="font-bold truncate flex-1">{title}</div>
      </div>
      <div className="text-[10px] text-gray-500 uppercase tracking-tighter mt-auto">{category}</div>
    </div>
  );
};
