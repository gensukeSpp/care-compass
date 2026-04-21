import { useState, useEffect } from 'react';
import { X, CheckCircle2, Loader2, ChevronRight, ListChecks, CheckSquare, Square } from 'lucide-react';
import { tasksSyncService, type GoogleTask, type GoogleTaskList } from '../../services/tasksSyncService';
import { useStore } from '../../store/useStore';

interface TasksModalProps {
  onClose: () => void;
}

export const TasksModal = ({ onClose }: TasksModalProps) => {
  const [step, setStep] = useState<'lists' | 'tasks'>('lists');
  const [isLoading, setIsLoading] = useState(true);
  const [taskLists, setTaskLists] = useState<GoogleTaskList[]>([]);
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [tasks, setTasks] = useState<GoogleTask[]>([]);
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const { notes, pendingNotes, addPendingNotes } = useStore();

  // 既存のタスクIDを取得
  const existingGoogleTaskIds = new Set([
    ...notes.map(n => n.googleTaskId).filter(Boolean),
    ...pendingNotes.map(n => n.googleTaskId).filter(Boolean)
  ]);

  useEffect(() => {
    fetchLists();
  }, []);

  const fetchLists = async () => {
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
  };

  const fetchTasks = async (listId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedTasks = await tasksSyncService.fetchTasksFromList(listId);
      setTasks(fetchedTasks);
      // 未インポートのタスクをデフォルトで全選択
      const unimportedTaskIds = fetchedTasks
        .filter(t => !existingGoogleTaskIds.has(t.googleTaskId))
        .map(t => t.googleTaskId);
      setSelectedTaskIds(new Set(unimportedTaskIds));
      setStep('tasks');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'タスクの取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleListSelect = (listId: string) => {
    setSelectedListId(listId);
    fetchTasks(listId);
  };

  const toggleTaskSelection = (taskId: string) => {
    const newSelected = new Set(selectedTaskIds);
    if (newSelected.has(taskId)) {
      newSelected.delete(taskId);
    } else {
      newSelected.add(taskId);
    }
    setSelectedTaskIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedTaskIds.size === tasks.filter(t => !existingGoogleTaskIds.has(t.googleTaskId)).length) {
      setSelectedTaskIds(new Set());
    } else {
      const unimportedTaskIds = tasks
        .filter(t => !existingGoogleTaskIds.has(t.googleTaskId))
        .map(t => t.googleTaskId);
      setSelectedTaskIds(new Set(unimportedTaskIds));
    }
  };

  const handleImport = () => {
    const tasksToImport = tasks.filter(t => selectedTaskIds.has(t.googleTaskId));
    if (tasksToImport.length === 0) return;

    const newPendingNotes = tasksToImport.map(task => ({
      title: task.title,
      content: task.notes || '',
      category: 'house' as const, // デフォルトカテゴリ
      googleTaskId: task.googleTaskId
    }));

    addPendingNotes(newPendingNotes);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <ListChecks className="text-blue-600" size={20} />
            {step === 'lists' ? 'Google Tasks リスト選択' : 'インポートするタスクを選択'}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="animate-spin text-blue-500 mb-4" size={40} />
              <p className="text-gray-500 text-sm">読み込み中...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              <p className="font-bold mb-1">エラーが発生しました</p>
              <p>{error}</p>
              <button 
                onClick={step === 'lists' ? fetchLists : () => fetchTasks(selectedListId!)}
                className="mt-2 text-red-600 hover:underline font-medium"
              >
                再試行
              </button>
            </div>
          ) : step === 'lists' ? (
            <div className="space-y-2">
              {taskLists.length === 0 ? (
                <p className="text-center text-gray-500 py-8">タスクリストが見つかりません</p>
              ) : (
                taskLists.map(list => (
                  <button
                    key={list.id}
                    onClick={() => handleListSelect(list.id)}
                    className="w-full text-left p-4 rounded-xl border border-gray-100 hover:border-blue-300 hover:bg-blue-50 transition-all flex justify-between items-center group"
                  >
                    <span className="font-medium text-gray-700">{list.title}</span>
                    <ChevronRight size={18} className="text-gray-400 group-hover:text-blue-500" />
                  </button>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {tasks.length === 0 ? (
                <p className="text-center text-gray-500 py-8">タスクが見つかりません</p>
              ) : (
                <>
                  <button 
                    onClick={toggleSelectAll}
                    className="flex items-center gap-2 px-2 py-1 mb-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  >
                    {selectedTaskIds.size === tasks.filter(t => !existingGoogleTaskIds.has(t.googleTaskId)).length ? (
                      <><CheckSquare size={16} /> 全選択解除</>
                    ) : (
                      <><Square size={16} /> 未インポートを全選択</>
                    )}
                  </button>
                  {tasks.map(task => {
                    const isImported = existingGoogleTaskIds.has(task.googleTaskId);
                    const isSelected = selectedTaskIds.has(task.googleTaskId);
                    
                    return (
                      <div
                        key={task.googleTaskId}
                        onClick={() => !isImported && toggleTaskSelection(task.googleTaskId)}
                        className={`p-3 rounded-xl border flex items-start gap-3 transition-all ${
                          isImported 
                            ? 'bg-gray-50 border-gray-100 opacity-60 cursor-not-allowed' 
                            : 'cursor-pointer hover:border-blue-200'
                        } ${isSelected ? 'border-blue-500 bg-blue-50/30' : 'border-gray-100'}`}
                      >
                        <div className="mt-0.5">
                          {isImported ? (
                            <CheckCircle2 className="text-green-500" size={18} />
                          ) : isSelected ? (
                            <CheckSquare className="text-blue-600" size={18} />
                          ) : (
                            <Square className="text-gray-300" size={18} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium leading-tight ${isImported ? 'text-gray-400' : 'text-gray-700'}`}>
                            {task.title}
                          </p>
                          {task.notes && (
                            <p className="text-xs text-gray-400 mt-1 truncate">
                              {task.notes}
                            </p>
                          )}
                          {isImported && (
                            <span className="text-[10px] bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded mt-1 inline-block">
                              インポート済み
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50 flex gap-3">
          {step === 'tasks' && (
            <button
              onClick={() => setStep('lists')}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded-xl transition-colors"
            >
              戻る
            </button>
          )}
          <button
            onClick={step === 'tasks' ? handleImport : onClose}
            disabled={step === 'tasks' && selectedTaskIds.size === 0}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-xl transition-all ${
              step === 'tasks'
                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg disabled:bg-gray-300 disabled:shadow-none'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'
            }`}
          >
            {step === 'tasks' ? `インポート (${selectedTaskIds.size})` : 'キャンセル'}
          </button>
        </div>
      </div>
    </div>
  );
};
