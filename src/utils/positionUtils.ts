import type { ClientRect, Active } from '@dnd-kit/core';
import type { Note, QuadrantId } from '../types';

/**
 * Converts a pixel coordinate to a percentage relative to a container size.
 */
export const pixelsToPercentage = (pixels: number, containerSize: number): number => {
  return (pixels / containerSize) * 100;
};

/**
 * Converts a percentage coordinate back to pixel units.
 */
export const percentageToPixels = (percentage: number, containerSize: number): number => {
  return (percentage / 100) * containerSize;
};

/**
 * Utility to get current viewport dimensions.
 */
export const getViewportSize = () => {
  return {
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
  };
};

/**
 * Determines the quadrant based on percentage-based coordinates.
 */
export const getQuadrantFromPosition = (x: number, y: number): QuadrantId => {
  if (x < 50 && y < 50) return 'can';
  if (x >= 50 && y < 50) return 'cannot';
  if (x < 50 && y >= 50) return 'risk';
  return 'request';
};

// quadrant に応じた初期位置を計算する関数
export const calculateInitialPosition = (quadrant: QuadrantId) => {
  switch (quadrant) {
    case 'can':
      return { x: 5, y: 5 };
    case 'cannot':
      return { x: 55, y: 5 };
    case 'risk':
      return { x: 5, y: 55 };
    case 'request':
      return { x: 55, y: 55 };
    default:
      return { x: 40, y: 40 }; // neutral やその他のケース
  }
};

export const convertToBoardPercentages = (rect: ClientRect, targetRect: DOMRect) => {
  // ボード上の%座標に変換
  // 注意: BoardがViewport全体(0,0)から始まっている前提
  // const xPct = pixelsToPercentage(rect.left, containerDimensions.width);
  // const yPct = pixelsToPercentage(rect.top, containerDimensions.height);

  // ノートの中心座標（ビューポート基準）
  const noteCenterX = rect.left + rect.width / 2;
  const noteCenterY = rect.top + rect.height / 2;

  // ボード左上を原点としたローカル座標に変換
  const localX = noteCenterX - targetRect.left;
  const localY = noteCenterY - targetRect.top;

  // ボード領域外に出ている場合はクランプ
  const clampedX = Math.min(Math.max(localX, 0), targetRect.width);
  const clampedY = Math.min(Math.max(localY, 0), targetRect.height);

  // ボード内の%座標に変換
  const xPct = pixelsToPercentage(clampedX, targetRect.width);
  const yPct = pixelsToPercentage(clampedY, targetRect.height);

  console.log(
    `Note center (viewport): (${noteCenterX}, ${noteCenterY}), ` +
    `Board rect: left=${targetRect.left}, top=${targetRect.top}, width=${targetRect.width}, height=${targetRect.height}, ` +
    `Local: (${localX}, ${localY}), Clamped: (${clampedX}, ${clampedY}), Percent: (${xPct}%, ${yPct}%)`
  );

  return { x: xPct, y: yPct }
}
export const getActiveNoteInfo = (active: Active, notes: Note[]) => {
  // データからタイプを判別
  const activeData = active.data.current;
  if (!activeData) return;

  const isPending = activeData.type === 'pending-note';
  const activeNote: Note = isPending ? activeData.note : notes.find(n => n.id === active.id);
  if (!activeNote) return;

  return { activeNote, isPending };
}


