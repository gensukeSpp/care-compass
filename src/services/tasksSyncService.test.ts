import { describe, it, expect, vi, beforeEach } from 'vitest';
import { tasksSyncService } from './tasksSyncService';

describe('tasksSyncService', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  describe('fetchTaskLists', () => {
    it('should fetch task lists successfully', async () => {
      const mockLists = [
        { id: 'list-1', title: 'List 1', updated: '2024-01-01T00:00:00Z' },
        { id: 'list-2', title: 'List 2', updated: '2024-01-02T00:00:00Z' },
      ];

      (fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ taskLists: mockLists }),
      });

      const lists = await tasksSyncService.fetchTaskLists();

      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/api/tasks/lists'), expect.any(Object));
      expect(lists).toEqual(mockLists);
    });

    it('should throw error when fetch fails', async () => {
      (fetch as any).mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'Unauthorized' }),
      });

      await expect(tasksSyncService.fetchTaskLists()).rejects.toThrow('Unauthorized');
    });
  });

  describe('fetchTasksFromList', () => {
    it('should fetch tasks from specific list successfully', async () => {
      const mockTasks = [
        { googleTaskId: 'task-1', title: 'Task 1', notes: 'Notes 1', updated: '2024-01-01T00:00:00Z' },
      ];
      const listId = 'test-list-id';

      (fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ tasks: mockTasks }),
      });

      const tasks = await tasksSyncService.fetchTasksFromList(listId);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining(`/api/tasks/list-tasks?listId=${listId}`),
        expect.any(Object)
      );
      expect(tasks).toEqual(mockTasks);
    });

    it('should throw error when fetch fails', async () => {
      (fetch as any).mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'Failed' }),
      });

      await expect(tasksSyncService.fetchTasksFromList('any')).rejects.toThrow('Failed');
    });
  });
});
