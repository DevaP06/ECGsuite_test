import { NavLink } from 'react-router-dom';
import {
  Home, Upload, Users, Activity, ClipboardList, FileText,
  CheckCircle, BarChart2, AlertTriangle, Server, ScrollText, Cpu,
  Clock, BookOpen, ShieldCheck, FlaskConical,
  ChevronLeft, ChevronRight,
} from 'lucide-react';
import ecgLogo from '../../assets/ECGenius_logo.png';
import { getRole } from '../../features/auth/roleUtils';
import { ROLE_NAV_ITEMS, ROLE_DISPLAY_NAMES } from '../../types/rbac';
import type { NavItem } from '../../types/rbac';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Home, Upload, Users, Activity, ClipboardList, FileText,
  CheckCircle, BarChart2, AlertTriangle, Server, ScrollText, Cpu,
  Clock, BookOpen, ShieldCheck, FlaskConical,
};

interface SidebarProps {
  isOpen: boolean;
  toggle: () => void;
}

export default function Sidebar({ isOpen, toggle }: SidebarProps) {
  const role = getRole();
  const navItems: NavItem[] = role ? ROLE_NAV_ITEMS[role] : [];
  const roleLabel = role ? ROLE_DISPLAY_NAMES[role] : 'ECGenius';

  return (
    <aside
      className={`${
        isOpen ? 'w-64' : 'w-20'
      } bg-gray-900 text-white h-screen flex flex-col transition-all duration-300 fixed left-0 top-0 z-30`}
    >
      {/* Logo + Brand */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-gray-700/60">
        <div className="flex items-center gap-3 overflow-hidden">
          <img src={ecgLogo} alt="ECGenius" className="w-9 h-9 shrink-0" />
          {isOpen && (
            <div className="min-w-0">
              <span className="text-lg font-bold leading-none block">ECGenius</span>
              <span className="text-xs text-blue-400 font-medium block truncate">{roleLabel}</span>
            </div>
          )}
        </div>
        <button
          onClick={toggle}
          className="p-1.5 rounded hover:bg-gray-700 text-gray-400 hover:text-white transition shrink-0"
          aria-label="Toggle sidebar"
        >
          {isOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {navItems.map((item) => {
          const Icon = ICON_MAP[item.icon] ?? Home;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 group relative ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'
                    : item.isPlaceholder
                    ? 'text-gray-400 hover:bg-gray-700/50 hover:text-gray-200'
                    : 'text-gray-300 hover:bg-gray-700/70 hover:text-white'
                }`
              }
              title={!isOpen ? item.label : undefined}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {isOpen && (
                <span className="flex items-center gap-1.5 text-sm font-medium truncate">
                  {item.label}
                  {item.isPlaceholder && (
                    <span className="text-[10px] leading-none font-semibold text-gray-500 bg-gray-700/60 rounded px-1.5 py-0.5 ml-auto shrink-0">
                      soon
                    </span>
                  )}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom brand accent */}
      <div className="px-4 py-4 border-t border-gray-700/60">
        {isOpen ? (
          <p className="text-xs text-gray-500 text-center">ECGenius Platform v1.0</p>
        ) : (
          <div className="w-2 h-2 rounded-full bg-blue-500 mx-auto" />
        )}
      </div>
    </aside>
  );
}
