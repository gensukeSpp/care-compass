import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { AuthGuard, ProfileGuard } from '../common/AuthProfileGuard';
import { WelcomeView } from '../common/WelcomeView';
import { LoadingView } from '../common/LoadingView';
import { BoardContent } from './BoardContent';

export const BoardPage = () => {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const currentProfileId = useAuthStore((state) => state.currentProfileId);
  const isLoading = useAuthStore((state) => state.isLoading);

  return (
    <AuthGuard
      isLoggedIn={isLoggedIn}
      isLoading={isLoading}
      currentProfileId={currentProfileId}
      welcome={<WelcomeView isLoggedIn={isLoggedIn} />}
      loading={<LoadingView currentProfileId={currentProfileId} isLoading={isLoading} />}
    >
      <ProfileGuard currentProfileId={currentProfileId} navigate={<Navigate to="/dashboard" />}>
        <BoardContent />
      </ProfileGuard>
    </AuthGuard>
  );
};
