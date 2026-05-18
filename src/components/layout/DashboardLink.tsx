import { Link, useLocation } from "react-router-dom";
import { LayoutGrid } from 'lucide-react';
import { useAuthStore } from "../../store/useAuthStore";

interface HeaderProps {
  isLoggedIn: boolean;
}

export function DashboardLink({ isLoggedIn }: HeaderProps) {
  const location = useLocation();
  const deselectProfile = useAuthStore((state) => state.deselectProfile);

  return (
    <>
      {isLoggedIn && (
        <div className="flex items-center gap-2">
          <Link
            to="/dashboard"
            onClick={() => deselectProfile()}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${location.pathname === '/dashboard'
              ? 'bg-indigo-50 text-indigo-600 font-medium'
              : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
              }`}
          >
            <LayoutGrid className="w-4 h-4" />
            <span className="text-sm">ボード一覧</span>
          </Link>
        </div>
      )}
    </>
  );
}