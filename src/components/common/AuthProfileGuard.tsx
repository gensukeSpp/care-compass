interface AuthGuardProps {
  isLoggedIn: boolean;
  isLoading: boolean;
  currentProfileId: string | null;
  welcome: React.ReactNode;
  loading: React.ReactNode;
  children: React.ReactNode;
}

export function AuthGuard({ isLoggedIn, isLoading, currentProfileId, welcome, loading, children }: AuthGuardProps) {
  if (!isLoggedIn) {
    return <>{welcome}</>;
  }

  if (isLoading && !currentProfileId) {
    return <>{loading}</>;
  }

  return <>{children}</>;
}

interface ProfileGuardProps {
  currentProfileId: string | null;
  navigate: React.ReactNode;
  children: React.ReactNode;
}

export function ProfileGuard({ currentProfileId, navigate, children }: ProfileGuardProps) {
  if (!currentProfileId) {
    return <>{navigate}</>;
  }

  return <>{children}</>;
}

