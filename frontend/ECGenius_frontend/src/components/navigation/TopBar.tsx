import { useState } from 'react';
import { Bell } from 'lucide-react';
import UserMenu from './UserMenu';
import Breadcrumb from './Breadcrumb';

interface TopBarProps {
  title?: string;
}

export default function TopBar({ title }: TopBarProps) {
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header className="flex justify-between items-center bg-white border-b border-gray-100 shadow-sm px-6 py-3 sticky top-0 z-20">
      <div className="flex flex-col gap-0.5 min-w-0">
        {title && <h1 className="text-lg font-bold text-slate-800 leading-none">{title}</h1>}
        <Breadcrumb />
      </div>

      <div className="flex items-center gap-3 shrink-0">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-full hover:bg-gray-100 transition"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5 text-slate-500" />
            <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-bold">
              3
            </span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-72 bg-white shadow-xl rounded-xl border border-gray-100 p-4 text-sm z-50">
              <p className="font-bold text-slate-800 mb-3">Notifications</p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2 text-slate-600">
                  <span className="text-green-500 mt-0.5">✓</span>
                  ECG uploaded successfully
                </li>
                <li className="flex items-start gap-2 text-slate-600">
                  <span className="text-amber-500 mt-0.5">⚠</span>
                  New abnormal reading detected
                </li>
                <li className="flex items-start gap-2 text-slate-600">
                  <span className="text-blue-500 mt-0.5">◷</span>
                  Appointment tomorrow 10 AM
                </li>
              </ul>
            </div>
          )}
        </div>

        <UserMenu />
      </div>
    </header>
  );
}
