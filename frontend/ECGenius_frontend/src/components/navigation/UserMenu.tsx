import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, ChevronDown, User } from 'lucide-react';
import { useAuth } from '../../features/auth/useAuth';
import { getRole } from '../../features/auth/roleUtils';
import { ROLE_DISPLAY_NAMES } from '../../types/rbac';

export default function UserMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { session, signout } = useAuth();
  const navigate = useNavigate();
  const role = getRole();

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const handleLogout = () => {
    signout();
    navigate('/login');
  };

  const initials = session?.user?.username
    ? session.user.username.slice(0, 2).toUpperCase()
    : 'U';

  const roleLabel = role ? ROLE_DISPLAY_NAMES[role] : 'Unknown Role';

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition"
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white text-xs font-bold shrink-0">
          {initials}
        </div>
        <div className="hidden md:block text-left min-w-0">
          <p className="text-sm font-semibold text-slate-800 leading-none truncate max-w-[120px]">
            {session?.user?.username ?? 'User'}
          </p>
          <p className="text-xs text-blue-600 font-medium">{roleLabel}</p>
        </div>
        <ChevronDown className="w-4 h-4 text-gray-400 hidden md:block" />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-52 bg-white shadow-xl rounded-xl border border-gray-100 py-1 z-50">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-semibold text-slate-800">{session?.user?.username}</p>
            <p className="text-xs text-slate-500 truncate">{session?.user?.email}</p>
            <span className="inline-block mt-1.5 px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
              {roleLabel}
            </span>
          </div>
          <a
            href="#"
            className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-gray-50 transition"
          >
            <User className="w-4 h-4 text-gray-400" />
            Profile
          </a>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
