import { UserPlus } from "lucide-react";
import { type Profile } from "../../types/index";
import type React from "react";

interface InviteActionProps {
  currentProfile: Profile | null;
  isOwner: boolean;
  setIsInviteModalOpen: (isOpen: boolean) => void;
}

export function InviteAction({ currentProfile, isOwner, setIsInviteModalOpen }: InviteActionProps) {
  return (
    <div className="flex items-center gap-2">
      {currentProfile && isOwner && (
        <button
          onClick={() => setIsInviteModalOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-all"
        >
          <UserPlus className="w-4 h-4" />
          <span className="text-sm">招待</span>
        </button>
      )}
    </div>

  )
}