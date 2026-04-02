import type { QuadrantId } from '../types';

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