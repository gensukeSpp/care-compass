import { useMemo } from 'react';
import { CheckCircle2, CheckSquare, Square } from 'lucide-react';
import type { GoogleTask } from '../../services/tasksSyncService';

interface TasksListProps {
  tasks: GoogleTask[];
  selectedTaskIds: Set<string>;
  setSelectedTaskIds: (ids: Set<string>) => void;
  isImported: (id: string) => boolean;
}

export function TaskSelectStep({ tasks, selectedTaskIds, setSelectedTaskIds, isImported }: TasksListProps) {
  const unimportedTasks = useMemo(
    () => tasks.filter(t => !isImported(t.googleTaskId)),
    [tasks, isImported]
  );

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
    if (selectedTaskIds.size === unimportedTasks.length) {
      setSelectedTaskIds(new Set());
    } else {
      const unimportedTaskIds = unimportedTasks.map(t => t.googleTaskId);
      setSelectedTaskIds(new Set(unimportedTaskIds));
    }
  };

  return (
    <div className="space-y-2">
      {tasks.length === 0 ? (
        <p className="text-center text-gray-500 py-8">タスクが見つかりません</p>
      ) : (
        <>
          <button
            onClick={toggleSelectAll}
            className="flex items-center gap-2 px-2 py-1 mb-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded transition-colors"
          >
            {selectedTaskIds.size === unimportedTasks.length ? (
              <><CheckSquare size={16} /> 全選択解除</>
            ) : (
              <><Square size={16} /> 未インポートを全選択</>
            )}
          </button>
          {tasks.map(task => {
            const isSelected = selectedTaskIds.has(task.googleTaskId);

            return (
              <button
                key={task.googleTaskId}
                onClick={() => !isImported(task.googleTaskId) && toggleTaskSelection(task.googleTaskId)}
                className={`p-3 rounded-xl border flex items-start gap-3 transition-all ${isImported(task.googleTaskId)
                  ? 'bg-gray-50 border-gray-100 opacity-60 cursor-not-allowed'
                  : 'cursor-pointer hover:border-blue-200'
                  } ${isSelected ? 'border-blue-500 bg-blue-50/30' : 'border-gray-100'}`}
              >
                <div className="mt-0.5">
                  {isImported(task.googleTaskId) ? (
                    <CheckCircle2 className="text-green-500" size={18} />
                  ) : isSelected ? (
                    <CheckSquare className="text-blue-600" size={18} />
                  ) : (
                    <Square className="text-gray-300" size={18} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium leading-tight ${isImported(task.googleTaskId) ? 'text-gray-400' : 'text-gray-700'}`}>
                    {task.title}
                  </p>
                  {task.notes && (
                    <p className="text-xs text-gray-400 mt-1 truncate">
                      {task.notes}
                    </p>
                  )}
                  {isImported(task.googleTaskId) && (
                    <span className="text-[10px] bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded mt-1 inline-block">
                      インポート済み
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </>
      )}
    </div>
  );
}