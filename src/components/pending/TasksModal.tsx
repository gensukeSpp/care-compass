import { X, Loader2, ListChecks } from "lucide-react";
import { useTasksImport } from "../../hooks/useTasksImport";
import { TaskListStep } from "./TaskListStep";
import { TaskSelectStep } from "./TaskSelectStep";
import { TaskError } from "./TaskError";

interface TasksModalProps {
  onClose: () => void;
}

export function TasksModal({ onClose }: TasksModalProps) {
  const {
    step,
    setStep,
    isLoading,
    taskLists,
    setSelectedListId,
    tasks,
    selectedTaskIds,
    setSelectedTaskIds,
    error,
    selectedListId,
    fetchLists,
    fetchTasks,
    isImported,
    handleImport
  } = useTasksImport(onClose);

  const handleListSelect = (listId: string) => {
    setSelectedListId(listId);
    fetchTasks(listId);
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
            <TaskError
              fetchTasks={fetchTasks}
              fetchLists={fetchLists}
              step={step}
              selectedListId={selectedListId}
              error={error}
            />
            // <div>エラーが発生しました {error}</div>
          ) : step === 'lists' ? (
            <TaskListStep
              taskLists={taskLists}
              onListSelect={handleListSelect}
              isLoading={isLoading}
            />
          ) : (
            <TaskSelectStep
              tasks={tasks}
              selectedTaskIds={selectedTaskIds}
              setSelectedTaskIds={setSelectedTaskIds}
              isImported={isImported}
            />
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
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-xl transition-all ${step === 'tasks'
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
}