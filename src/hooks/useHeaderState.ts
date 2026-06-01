import { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';

export const useHeaderState = () => {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const currentUser = useAuthStore((state) => state.currentUser);
  const currentProfiles = useAuthStore((state) => state.currentProfiles);
  const currentProfileId = useAuthStore((state) => state.currentProfileId);
  const currentRoles = useAuthStore((state) => state.currentRoles);

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const currentProfile = currentProfiles.find((p) => p.id === currentProfileId);
  const isOwner = currentProfileId ? currentRoles[currentProfileId] === 'owner' : false;

  return {
    isLoggedIn,
    currentUser,
    isInviteModalOpen,
    setIsInviteModalOpen,
    isSettingsOpen,
    setIsSettingsOpen,
    currentProfile,
    isOwner,
  };
}
