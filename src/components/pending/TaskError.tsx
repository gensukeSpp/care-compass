interface TaskErrorProps {
  fetchLists: () => Promise<void>;
  fetchTasks: (listId: string) => Promise<void>;
  step: 'lists' | 'tasks';
  selectedListId: string | null;
  error: string;
}

export function TaskError({ fetchTasks, fetchLists, step, selectedListId, error }: TaskErrorProps) {
  return (
    <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
      <p className="font-bold mb-1">エラーが発生しました</p>
      <p>{error}</p>
      <button
        onClick={step === 'lists' || !selectedListId ? fetchLists : () => fetchTasks(selectedListId)}
        className="mt-2 text-red-600 hover:underline font-medium"
      >
        再試行
      </button>
    </div>
  );
}