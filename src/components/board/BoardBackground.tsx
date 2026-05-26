
import { useQuadrantLabels } from '../../hooks/useQuadrantLabels';

export function BoardBackground({ type }: { type: '4-quadrant' | 'priority' }) {
  const labels = useQuadrantLabels();

  if (type === '4-quadrant') {
    return (
      <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
        {/* 4分割の十字線（見た目だけ） */}
        <div className="border-r border-b border-gray-300 p-4 text-gray-400">{labels.can}</div>
        <div className="border-b border-gray-300 p-4 text-gray-400">{labels.cannot}</div>
        <div className="border-r border-gray-300 p-4 text-gray-400">{labels.risk}</div>
        <div className="p-4 text-gray-400">{labels.request}</div>
      </div>
    );
  }
  return null;
}