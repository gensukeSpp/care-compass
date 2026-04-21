/**
 * Google Tasks 同期サービス
 */

export interface GoogleTask {
  googleTaskId: string;
  title: string;
  notes: string;
  updated: string;
}

const API_BASE = import.meta.env.VITE_API_URL || '';

export const tasksSyncService = {
  /**
   * Google Tasks を同期取得します。
   */
  async fetchTasks(): Promise<GoogleTask[]> {
    const response = await fetch(`${API_BASE}/api/tasks/sync`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const message = errorData.details || errorData.error || 'Failed to sync tasks';
      throw new Error(message);
    }

    const data = await response.json();
    return data.tasks || [];
  },
};
