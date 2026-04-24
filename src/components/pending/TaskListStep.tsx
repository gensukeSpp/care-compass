import { ChevronRight } from 'lucide-react';
import type { GoogleTaskList } from '../../services/tasksSyncService';

interface TasksListProps {
  taskLists: GoogleTaskList[];
  onListSelect: (listId: string) => void;
  isLoading: boolean;
}

export function TaskListStep({ taskLists, onListSelect, isLoading }: TasksListProps) {
  return (
    <div className="space-y-2">
      {!isLoading && taskLists.length === 0 ? (
        <p className="text-center text-gray-500 py-8">タスクリストが見つかりません</p>
      ) : (
        taskLists.map(list => (
          <button
            key={list.id}
            onClick={() => onListSelect(list.id)}
            className="w-full text-left p-4 rounded-xl border border-gray-100 hover:border-blue-300 hover:bg-blue-50 transition-all flex justify-between items-center group"
          >
            <span className="font-medium text-gray-700">{list.title}</span>
            <ChevronRight size={18} className="text-gray-400 group-hover:text-blue-500" />
          </button>
        ))
      )}
    </div>

  );
}