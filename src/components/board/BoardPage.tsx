import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { useStore } from '../../store/useStore';
import { AuthGuard, ProfileGuard } from '../common/AuthProfileGuard';
import { WelcomeView } from '../common/WelcomeView';
import { LoadingView } from '../common/LoadingView';
import { BoardContent } from './BoardContent';

export const BoardPage = () => {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const currentProfileId = useAuthStore((state) => state.currentProfileId);
  const isLoadingAuth = useAuthStore((state) => state.isLoading);
  const fetchNotes = useStore((state) => state.fetchNotes);
  const isLoadingNotes = useStore((state) => state.isLoading);

  useEffect(() => {
    if (currentProfileId) {
      fetchNotes(currentProfileId);
    }
  }, [currentProfileId, fetchNotes]);

  return (
    <AuthGuard
      isLoggedIn={isLoggedIn}
      isLoading={isLoadingAuth || isLoadingNotes}
      currentProfileId={currentProfileId}
      welcome={<WelcomeView isLoggedIn={isLoggedIn} />}
      loading={<LoadingView currentProfileId={currentProfileId} isLoading={isLoadingAuth || isLoadingNotes} />}
    >
      <ProfileGuard currentProfileId={currentProfileId} navigate={<Navigate to="/dashboard" />}>
        <BoardContent />
      </ProfileGuard>
    </AuthGuard>
  );
};
