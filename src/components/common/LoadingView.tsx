
interface LoadingViewProps {
  currentProfileId: string | null;
  isLoading: boolean;
}

export function LoadingView({ currentProfileId, isLoading }: LoadingViewProps) {

  // 2. 読み込み中の場合
  if (isLoading && !currentProfileId) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // 3. プロファイルが選択されていない場合
  if (!currentProfileId) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }
}