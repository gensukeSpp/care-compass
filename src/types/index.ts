// 象限の定義
export type QuadrantId = 'can' | 'cannot' | 'risk' | 'request' | 'pending';

// カテゴリ（色分け用）
export type Category = 'house' | 'food' | 'health' | 'medical' | 'social';

// 付箋の型定義 (Unified)
export interface History {
  id: string;
  note_id: string;
  from_status: QuadrantId;
  to_status: QuadrantId;
  user_id: string;
  created_at: string;
  // UI用途
  from?: QuadrantId;
  to?: QuadrantId;
  timestamp?: string;
}

export interface Note {
  id: string;
  profile_id: string;
  title: string;
  category: Category;
  status: QuadrantId;
  content: string; // Markdown形式
  x: number;
  y: number;
  author_id?: string;
  google_task_id?: string;
  created_at?: string;
  updated_at?: string;

  // UI用途の互換性維持
  updatedAt?: string;
  authorName?: string;
  history?: History[];
  googleTaskId?: string;
}

export interface Profile {
  id: string;
  name: string;
  created_by: string; // user_id
  created_at?: string;
  updated_at?: string;
}

export interface Member {
  profile_id: string;
  profiles: Profile[];
}
