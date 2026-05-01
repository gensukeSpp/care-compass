/**
 * Google Tasks 同期サービス
 */

export interface GoogleTask {
  googleTaskId: string;
  title: string;
  notes: string;
  updated: string;
}

export interface GoogleTaskList {
  id: string;
  title: string;
  updated: string;
}

import { getApiBaseUrl } from '../utils/api';

const API_BASE = getApiBaseUrl();
console.log(`API_BASE: ${API_BASE}`);

export const tasksSyncService = {
  /**
   * Google Tasks を同期取得します（デフォルトリスト）。
   */
  async fetchTasks(): Promise<GoogleTask[]> {
    return this.fetchTasksFromList('@default');
  },

  /**
   * Google Task Lists を取得します。
   */
  async fetchTaskLists(): Promise<GoogleTaskList[]> {
    const response = await fetch(`${API_BASE}/api/tasks/lists`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const message = errorData.error || 'Failed to fetch task lists';
      throw new Error(message);
    }

    const data = await response.json();
    return data.taskLists || [];
  },

  /**
   * 指定したリストから Google Tasks を取得します。
   */
  async fetchTasksFromList(listId: string): Promise<GoogleTask[]> {
    const response = await fetch(`${API_BASE}/api/tasks/list-tasks?listId=${encodeURIComponent(listId)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const message = errorData.error || 'Failed to sync tasks';
      throw new Error(message);
    }

    const data = await response.json();
    return data.tasks || [];
  },
};
