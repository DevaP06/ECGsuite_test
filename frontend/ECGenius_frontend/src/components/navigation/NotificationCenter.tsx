import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell, Loader2, AlertTriangle, Stethoscope, ClipboardList, ShieldAlert,
  Check, X, Inbox, CheckCheck,
} from 'lucide-react';
import { useAuth } from '../../features/auth/useAuth';
import { ecgService } from '../../services/ecgService';
import { reviewService } from '../../services/reviewService';
import {
  getReadIds, markAsRead, markAllAsRead, getDismissedIds, dismiss, getNotificationPreferences,
} from '../../services/notificationStore';
import { extractErrorMessage } from '../../utils/errorUtils';
import { buildNotifications } from '../../utils/notifications';
import type { NotificationItem, NotificationCategory } from '../../types/notification';

type TabKey = 'all' | NotificationCategory;

const TABS: { key: TabKey; label: string }[] = [
  { key: 'all',       label: 'All' },
  { key: 'diagnosis', label: 'Diagnoses' },
  { key: 'review',    label: 'Reviews' },
  { key: 'alert',     label: 'Alerts' },
];

const CATEGORY_DISPLAY: Record<NotificationCategory, { icon: typeof Stethoscope; badgeClass: string }> = {
  diagnosis: { icon: Stethoscope,   badgeClass: 'bg-blue-50 text-blue-600 border-blue-200' },
  review:    { icon: ClipboardList, badgeClass: 'bg-indigo-50 text-indigo-600 border-indigo-200' },
  alert:     { icon: ShieldAlert,   badgeClass: 'bg-red-50 text-red-600 border-red-200' },
};

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export default function NotificationCenter() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(() => getReadIds());
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(() => getDismissedIds());
  const [preferences, setPreferences] = useState(() => getNotificationPreferences());
  const [tab, setTab] = useState<TabKey>('all');

  const role = session?.user?.role;
  const supportsFeed = role === 'PATIENT' || role === 'PHC_DOCTOR' || role === 'CARDIOLOGIST';

  const load = useCallback(async () => {
    if (!supportsFeed) {
      setLoaded(true);
      return;
    }
    setLoading(true);
    setFetchError(null);
    try {
      if (role === 'CARDIOLOGIST') {
        const queue = await reviewService.getQueue();
        setItems(buildNotifications([], queue));
      } else {
        const analyses = await ecgService.getMyAnalyses();
        setItems(buildNotifications(analyses, []));
      }
      setLoaded(true);
    } catch (err: unknown) {
      setFetchError(extractErrorMessage(err, 'Failed to load notifications.'));
    } finally {
      setLoading(false);
    }
  }, [role, supportsFeed]);

  useEffect(() => {
    if (open && !loaded && !loading) load();
  }, [open, loaded, loading, load]);

  // Re-read preferences each time the dropdown opens, so changes saved on the
  // Settings page take effect without requiring a full page reload.
  useEffect(() => {
    if (open) setPreferences(getNotificationPreferences());
  }, [open]);

  const categoryEnabled = useCallback(
    (category: NotificationCategory) => {
      if (category === 'diagnosis') return preferences.diagnosisUpdates;
      if (category === 'review') return preferences.reviewUpdates;
      return preferences.emergencyAlerts;
    },
    [preferences],
  );

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const visibleItems = useMemo(
    () => items.filter((item) => !dismissedIds.has(item.id) && categoryEnabled(item.category)),
    [items, dismissedIds, categoryEnabled],
  );

  const unreadCount = useMemo(
    () => visibleItems.filter((item) => !readIds.has(item.id)).length,
    [visibleItems, readIds],
  );

  const filteredItems = useMemo(
    () => (tab === 'all' ? visibleItems : visibleItems.filter((item) => item.category === tab)),
    [visibleItems, tab],
  );

  const handleMarkRead = (id: string) => setReadIds(markAsRead(id));

  const handleMarkAllRead = () => setReadIds(markAllAsRead(visibleItems.map((item) => item.id)));

  const handleDismiss = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDismissedIds(dismiss(id));
  };

  const handleOpenItem = (item: NotificationItem) => {
    handleMarkRead(item.id);
    setOpen(false);
    if (item.link) navigate(item.link);
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-full hover:bg-gray-100 transition"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 text-slate-500" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white shadow-xl rounded-xl border border-gray-100 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <p className="font-bold text-slate-800 text-sm">Notifications</p>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 transition"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 px-3 pt-2.5">
            {TABS.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={`px-2.5 py-1 rounded-full text-xs font-semibold transition ${
                  tab === key
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-400 hover:text-slate-600 hover:bg-gray-50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Body */}
          <div className="max-h-96 overflow-y-auto px-2 py-2">
            {!supportsFeed ? (
              <div className="px-4 py-8 text-center flex flex-col items-center gap-2">
                <Inbox className="w-8 h-8 text-slate-200" />
                <p className="text-sm text-slate-500">Notifications aren't available for this role yet.</p>
              </div>
            ) : fetchError ? (
              <div className="px-4 py-6 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <p className="text-xs text-red-600">{fetchError}</p>
              </div>
            ) : loading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="px-4 py-8 text-center flex flex-col items-center gap-2">
                <Inbox className="w-8 h-8 text-slate-200" />
                <p className="text-sm font-semibold text-slate-600">You're all caught up</p>
                <p className="text-xs text-slate-400">
                  {tab === 'all'
                    ? 'New diagnosis, review, and alert updates will appear here.'
                    : 'No notifications in this category right now.'}
                </p>
              </div>
            ) : (
              <ul className="space-y-1">
                {filteredItems.map((item) => {
                  const isUnread = !readIds.has(item.id);
                  const { icon: Icon, badgeClass } = CATEGORY_DISPLAY[item.category];
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => handleOpenItem(item)}
                        className={`w-full text-left flex items-start gap-2.5 px-2.5 py-2.5 rounded-lg transition group ${
                          isUnread ? 'bg-blue-50/40 hover:bg-blue-50' : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center border ${badgeClass}`}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            {isUnread && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />}
                            <p className="text-xs font-bold text-slate-800 truncate">{item.title}</p>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{item.description}</p>
                          <p className="text-[11px] text-slate-400 mt-1">{timeAgo(item.timestamp)}</p>
                        </div>
                        <div className="shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                          {isUnread && (
                            <span
                              role="button"
                              tabIndex={0}
                              title="Mark as read"
                              onClick={(e) => { e.stopPropagation(); handleMarkRead(item.id); }}
                              className="p-1 rounded hover:bg-white text-slate-400 hover:text-emerald-600 transition"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </span>
                          )}
                          <span
                            role="button"
                            tabIndex={0}
                            title="Dismiss"
                            onClick={(e) => handleDismiss(item.id, e)}
                            className="p-1 rounded hover:bg-white text-slate-400 hover:text-red-600 transition"
                          >
                            <X className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
