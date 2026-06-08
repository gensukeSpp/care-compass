import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import { useStore } from '../store/useStore';
import { LoadingView } from '../components/common/LoadingView';
import { HistoryTimelineView } from '../components/history/HistoryTimelineView';
import { HistoryNoteView } from '../components/history/HistoryNoteView';

interface HistoryItem {
  history_id: string;
  note_id: string;
  note_title: string;
  from_status: string;
  to_status: string;
  created_at: string;
}

export function HistoryPage() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'timeline' | 'note'>('timeline');
  const currentProfileId = useAuthStore((state) => state.currentProfileId);
  const allNotes = useStore((state) => state.notes);

  useEffect(() => {
    if (!currentProfileId) return;

    const fetchHistory = async () => {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_all_history', {
        p_profile_id: currentProfileId,
      });

      if (error) {
        console.error('Error fetching history:', error);
      } else {
        setHistory(data || []);
      }
      setLoading(false);
    };

    fetchHistory();
  }, [currentProfileId]);

  if (loading) return <LoadingView currentProfileId={currentProfileId} isLoading={loading} />;

  return (
    <div className="h-full overflow-y-auto p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">変更履歴一覧</h1>
        <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setViewMode('timeline')}
            className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${viewMode === 'timeline' ? 'bg-white shadow text-indigo-700' : 'text-gray-600'
              }`}
          >
            時系列
          </button>
          <button
            onClick={() => setViewMode('note')}
            className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${viewMode === 'note' ? 'bg-white shadow text-indigo-700' : 'text-gray-600'
              }`}
          >
            付箋別
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-6">
        {viewMode === 'timeline' ? (
          <HistoryTimelineView history={history} />
        ) : (
          <HistoryNoteView history={history} allNotes={allNotes} />
        )}
      </div>
    </div>
  );
}
