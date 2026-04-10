// 象限の定義
export type QuadrantId = 'can' | 'cannot' | 'risk' | 'request' | 'pending';

// カテゴリ（色分け用）
export type Category = 'house' | 'food' | 'health' | 'medical' | 'social';

// 付箋の型定義 (Unified)
export interface History {
  from: QuadrantId;
  to: QuadrantId;
  timestamp: string;
}

export interface Note {
  id: string;
  title: string;
  category: Category;
  status: QuadrantId;
  content: string; // Markdown形式
  updatedAt?: string;
  authorName?: string;
  // Position as percentages (0-100)
  x: number;
  y: number;
  history?: History[];
}
