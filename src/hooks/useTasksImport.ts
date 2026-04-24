import { useState, useMemo, useEffect, useCallback } from 'react';
import { useStore } from '../store/useStore';
import type { GoogleTask, GoogleTaskList } from '../services/tasksSyncService';
import { mapGoogleTaskToPendingNote } from '../utils/taskToNote';
import { tasksSyncService } from '../services/tasksSyncService';

export const useTasksImport = (onClose: () => void) => {
  const [step, setStep] = useState<'lists' | 'tasks'>('lists');
  const [isLoading, setIsLoading] = useState(true);
  const [taskLists, setTaskLists] = useState<GoogleTaskList[]>([]);
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [tasks, setTasks] = useState<GoogleTask[]>([]);
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const { notes, pendingNotes, addPendingNotes } = useStore();

  // 既存のタスクIDを取得
  const existingGoogleTaskIds = useMemo(() => new Set([
    ...notes.map(n => n.googleTaskId).filter(Boolean),
    ...pendingNotes.map(n => n.googleTaskId).filter(Boolean)
  ]), [notes, pendingNotes]);

  const fetchLists = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const lists = await tasksSyncService.fetchTaskLists();
      setTaskLists(lists);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'リストの取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const isImported = useCallback((id: string) => {
    return existingGoogleTaskIds.has(id);
  }, [existingGoogleTaskIds]);

  const fetchTasks = useCallback(async (listId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedTasks = await tasksSyncService.fetchTasksFromList(listId);
      setTasks(fetchedTasks);
      // 未インポートのタスクをデフォルトで全選択
      const unimportedTaskIds = fetchedTasks
        .filter(t => !isImported(t.googleTaskId))
        .map(t => t.googleTaskId);
      console.log(`Unimported task ids: ${unimportedTaskIds.join(', ')}`);
      setSelectedTaskIds(new Set(unimportedTaskIds));
      setStep('tasks');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'タスクの取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, [isImported]);

  const handleImport = useCallback(() => {
    const tasksToImport = tasks.filter(t => selectedTaskIds.has(t.googleTaskId));
    if (tasksToImport.length === 0) return;

    const newPendingNotes = tasksToImport.map(task => mapGoogleTaskToPendingNote(task));
    addPendingNotes(newPendingNotes);
    onClose();
  }, [tasks, selectedTaskIds, addPendingNotes, onClose]);

  useEffect(() => {
    fetchLists();
  }, [fetchLists]);

  return { step, setStep, isLoading, setIsLoading, taskLists, setTaskLists, selectedListId, setSelectedListId, tasks, setTasks, selectedTaskIds, setSelectedTaskIds, error, setError, fetchLists, fetchTasks, isImported, handleImport };
};