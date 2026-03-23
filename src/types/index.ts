// 象限の定義
export type QuadrantId = 'can' | 'cannot' | 'risk' | 'request';

// カテゴリ（色分け用）
export type Category = 'house' | 'food' | 'health' | 'medical' | 'social';

// 付箋の型定義
export interface StickyNote {
  id: string;
  title: string;
  content: string; // Markdown形式
  quadrant: QuadrantId;
  category: Category;
  position: { x: number; y: number }; // ボード内での絶対座標(px)または比率(%)
  authorName?: string;
  updatedAt: string;
}