import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Palette, Bell, ShieldCheck, UserCog, Clock3, Sun, Moon, Monitor,
  LayoutGrid, AlignJustify, LogOut, ExternalLink, Info, Mail,
} from 'lucide-react';
import AppShell from '../../layouts/AppShell';
import { useAuth } from '../../features/auth/useAuth';
import { ROLE_DISPLAY_NAMES } from '../../types/rbac';
import type { UserRole } from '../../types/rbac';
import {
  getNotificationPreferences, saveNotificationPreferences,
  type NotificationPreferences,
} from '../../services/notificationStore';
import {
  getAppearancePreferences, saveAppearancePreferences,
  getPrivacyPreferences, savePrivacyPreferences,
  type ThemePreference, type DensityPreference,
} from '../../services/settingsStore';

type TabKey = 'appearance' | 'notifications' | 'privacy' | 'account' | 'session';

const TABS: { key: TabKey; label: string; icon: typeof Palette }[] = [
  { key: 'appearance',    label: 'Appearance',          icon: Palette },
  { key: 'notifications', label: 'Notifications',       icon: Bell },
  { key: 'privacy',       label: 'Privacy',             icon: ShieldCheck },
  { key: 'account',       label: 'Account Preferences', icon: UserCog },
  { key: 'session',       label: 'Session Information', icon: Clock3 },
];

function SectionCard({ title, icon: Icon, children, footnote }: {
  title: string;
  icon: typeof Palette;
  children: React.ReactNode;
  footnote?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
      <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide flex items-center gap-2">
        <Icon className="w-4 h-4 text-slate-400" />
        {title}
      </h3>
      {children}
      {footnote && (
        <p className="text-xs text-slate-400 pt-2 border-t border-gray-50 flex items-start gap-1.5">
          <Info className="w-3.5 h-3.5 shrink-0 mt-px" />
          {footnote}
        </p>
      )}
    </div>
  );
}

function ToggleRow({ label, description, checked, onChange }: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <label className="flex items-start justify-between gap-4 py-2.5 cursor-pointer group">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-700 group-hover:text-slate-900 transition">{label}</p>
        <p className="text-xs text-slate-500 mt-0.5">{description}</p>
      </div>
      <span className="relative inline-flex shrink-0 mt-0.5">
        <input
          type="checkbox"
          className="peer sr-only"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className="w-10 h-5.5 rounded-full bg-gray-200 peer-checked:bg-blue-600 transition-colors duration-200" />
        <span className="absolute left-0.5 top-0.5 w-4.5 h-4.5 rounded-full bg-white shadow-sm transition-transform duration-200 peer-checked:translate-x-[18px]" />
      </span>
    </label>
  );
}

function SegmentedOption<T extends string>({ value, current, label, icon: Icon, onSelect }: {
  value: T;
  current: T;
  label: string;
  icon: typeof Sun;
  onSelect: (value: T) => void;
}) {
  const active = value === current;
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold border transition ${
        active
          ? 'bg-blue-50 text-blue-700 border-blue-200'
          : 'bg-white text-slate-500 border-gray-200 hover:bg-gray-50'
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}

export default function SettingsPage() {
  const { session, signout } = useAuth();
  const navigate = useNavigate();
  const user = session?.user;
  const role = user?.role as UserRole | undefined;

  const [tab, setTab] = useState<TabKey>('appearance');

  const [appearance, setAppearance] = useState(() => getAppearancePreferences());
  const [notificationPrefs, setNotificationPrefs] = useState(() => getNotificationPreferences());
  const [privacy, setPrivacy] = useState(() => getPrivacyPreferences());

  const handleThemeChange = (theme: ThemePreference) => {
    const next = { ...appearance, theme };
    setAppearance(next);
    saveAppearancePreferences(next);
    toast.success('Appearance preference saved.');
  };

  const handleDensityChange = (density: DensityPreference) => {
    const next = { ...appearance, density };
    setAppearance(next);
    saveAppearancePreferences(next);
    toast.success('Appearance preference saved.');
  };

  const handleNotificationToggle = (key: keyof NotificationPreferences, value: boolean) => {
    const next = { ...notificationPrefs, [key]: value };
    setNotificationPrefs(next);
    saveNotificationPreferences(next);
    toast.success('Notification preference saved.');
  };

  const handlePrivacyToggle = (value: boolean) => {
    const next = { ...privacy, shareAnonymizedDataForResearch: value };
    setPrivacy(next);
    savePrivacyPreferences(next);
    toast.success('Privacy preference saved.');
  };

  const handleSignout = () => {
    signout();
    navigate('/login');
  };

  const formatDateTime = (value?: string | null) => (value ? new Date(value).toLocaleString() : 'Not available');
  const formatDate = (value?: string) => (value ? new Date(value).toLocaleDateString() : 'Not available');

  return (
    <AppShell title="Settings">
      <div className="max-w-4xl mx-auto space-y-5 pb-10">

        {/* Tabs */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-1.5 flex flex-wrap gap-1">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition ${
                tab === key ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* Appearance */}
        {tab === 'appearance' && (
          <SectionCard
            title="Appearance"
            icon={Palette}
            footnote="These preferences are saved on this device. Full theme switching is rolling out — your choice will be applied automatically once it's available."
          >
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Theme</p>
              <div className="flex gap-2">
                <SegmentedOption value="light" current={appearance.theme} label="Light" icon={Sun} onSelect={handleThemeChange} />
                <SegmentedOption value="dark" current={appearance.theme} label="Dark" icon={Moon} onSelect={handleThemeChange} />
                <SegmentedOption value="system" current={appearance.theme} label="System" icon={Monitor} onSelect={handleThemeChange} />
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Layout Density</p>
              <div className="flex gap-2">
                <SegmentedOption value="comfortable" current={appearance.density} label="Comfortable" icon={LayoutGrid} onSelect={handleDensityChange} />
                <SegmentedOption value="compact" current={appearance.density} label="Compact" icon={AlignJustify} onSelect={handleDensityChange} />
              </div>
            </div>
          </SectionCard>
        )}

        {/* Notifications */}
        {tab === 'notifications' && (
          <SectionCard
            title="Notification Preferences"
            icon={Bell}
            footnote="These preferences control which updates appear in your notification center and are saved on this device. Email delivery is future-ready and will activate once available."
          >
            <div className="divide-y divide-gray-50">
              <ToggleRow
                label="Diagnosis updates"
                description="Get notified when ECG analyses complete and diagnoses are ready."
                checked={notificationPrefs.diagnosisUpdates}
                onChange={(v) => handleNotificationToggle('diagnosisUpdates', v)}
              />
              <ToggleRow
                label="Specialist review updates"
                description="Get notified about review requests, assignments, and completed reviews."
                checked={notificationPrefs.reviewUpdates}
                onChange={(v) => handleNotificationToggle('reviewUpdates', v)}
              />
              <ToggleRow
                label="Emergency alerts"
                description="Always be notified about emergency findings and urgent cases — recommended."
                checked={notificationPrefs.emergencyAlerts}
                onChange={(v) => handleNotificationToggle('emergencyAlerts', v)}
              />
              <ToggleRow
                label="Email digest"
                description="Receive a periodic email summary of your notifications."
                checked={notificationPrefs.emailDigest}
                onChange={(v) => handleNotificationToggle('emailDigest', v)}
              />
            </div>
          </SectionCard>
        )}

        {/* Privacy */}
        {tab === 'privacy' && (
          <SectionCard title="Privacy" icon={ShieldCheck}>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Data Visibility</p>
              <p className="text-sm text-slate-600 leading-relaxed">
                {role === 'PATIENT'
                  ? 'Your ECG reports and clinical context are visible to your care team and any specialist assigned to review your case, as part of standard clinical workflow.'
                  : 'Patient records you access are shared only with assigned care team members and reviewing specialists, in line with your organization’s clinical access policy.'}
              </p>
            </div>
            <div className="pt-1 border-t border-gray-50">
              <ToggleRow
                label="Share anonymized data for research"
                description="Allow de-identified analysis data to be used to help improve ECGenius's diagnostic models."
                checked={privacy.shareAnonymizedDataForResearch}
                onChange={handlePrivacyToggle}
              />
            </div>
            <p className="text-xs text-slate-400 pt-2 border-t border-gray-50 flex items-start gap-1.5">
              <Info className="w-3.5 h-3.5 shrink-0 mt-px" />
              This preference is saved on this device. No data is shared unless this option is enabled and a research program is active.
            </p>
          </SectionCard>
        )}

        {/* Account Preferences */}
        {tab === 'account' && (
          <SectionCard title="Account Preferences" icon={UserCog}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Username</p>
                <p className="text-sm text-slate-800 font-medium mt-0.5">{user?.username || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Email</p>
                <p className="text-sm text-slate-800 font-medium mt-0.5 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-300" />
                  {user?.email || 'Not provided'}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Role</p>
                <p className="text-sm text-slate-800 font-medium mt-0.5">{role ? ROLE_DISPLAY_NAMES[role] : 'Not provided'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Member Since</p>
                <p className="text-sm text-slate-800 font-medium mt-0.5">{formatDate(user?.createdAt)}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate('/profile')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-blue-700 hover:bg-blue-50 transition"
            >
              <ExternalLink className="w-4 h-4" />
              Manage profile details
            </button>
            <p className="text-xs text-slate-400 pt-2 border-t border-gray-50 flex items-start gap-1.5">
              <Info className="w-3.5 h-3.5 shrink-0 mt-px" />
              Name, phone, photo, and security settings are managed on your Profile page.
            </p>
          </SectionCard>
        )}

        {/* Session Information */}
        {tab === 'session' && (
          <SectionCard title="Session Information" icon={Clock3}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Sign-in Method</p>
                <p className="text-sm text-slate-800 font-medium mt-0.5">
                  {user?.authProvider === 'google' ? 'Google' : user?.authProvider === 'local' ? 'Email & Password' : 'Not available'}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Last Login</p>
                <p className="text-sm text-slate-800 font-medium mt-0.5">{formatDateTime(user?.lastLogin)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Account Created</p>
                <p className="text-sm text-slate-800 font-medium mt-0.5">{formatDateTime(user?.createdAt)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Account Status</p>
                <p className="text-sm text-slate-800 font-medium mt-0.5 capitalize">{user?.status || 'Not available'}</p>
              </div>
            </div>
            <div className="pt-2 border-t border-gray-50">
              <button
                type="button"
                onClick={handleSignout}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-red-200 text-sm font-semibold text-red-600 hover:bg-red-50 transition"
              >
                <LogOut className="w-4 h-4" />
                Sign out of this device
              </button>
            </div>
          </SectionCard>
        )}
      </div>
    </AppShell>
  );
}
