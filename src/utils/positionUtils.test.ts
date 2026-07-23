import { describe, it, expect } from 'vitest';
import { pixelsToPercentage, percentageToPixels, getQuadrantFromPosition } from './positionUtils';

describe('positionUtils', () => {
  it('converts pixels to percentage correctly', () => {
    expect(pixelsToPercentage(50, 100)).toBe(50);
    expect(pixelsToPercentage(25, 200)).toBe(12.5);
  });

  it('converts percentage to pixels correctly', () => {
    expect(percentageToPixels(50, 100)).toBe(50);
    expect(percentageToPixels(12.5, 200)).toBe(25);
  });

  it('identifies quadrants correctly', () => {
    expect(getQuadrantFromPosition(25, 25)).toBe('can');
    expect(getQuadrantFromPosition(75, 25)).toBe('cannot');
    expect(getQuadrantFromPosition(25, 75)).toBe('risk');
    expect(getQuadrantFromPosition(75, 75)).toBe('request');
  });

  it('returns 0 when container size is 0', () => {
    expect(pixelsToPercentage(50, 0)).toBe(0);
  });
});
