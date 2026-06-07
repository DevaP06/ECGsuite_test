import { useState, useEffect, useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';
import {
  User as UserIcon, Loader2, AlertTriangle, RefreshCw, Pencil, Save, X,
  BadgeCheck, ShieldCheck, Briefcase, Lock, Info,
} from 'lucide-react';
import AppShell from '../../layouts/AppShell';
import { useAuth } from '../../features/auth/useAuth';
import { profileService } from '../../services/profileService';
import { extractErrorMessage, getHttpStatus } from '../../utils/errorUtils';
import AuthErrorCard, { type AuthErrorReason } from '../../components/common/AuthErrorCard';
import EmptyStateCard from '../../components/common/EmptyStateCard';
import LoadingStateCard from '../../components/common/LoadingStateCard';
import { ROLE_DISPLAY_NAMES } from '../../types/rbac';
import { ROLE_PROFILE_FIELDS } from '../../types/onboarding';
import type { UserRole } from '../../types/rbac';
import AvatarUploader from '../../components/profile/AvatarUploader';

type TabKey = 'overview' | 'professional' | 'account' | 'security';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'overview',     label: 'Overview' },
  { key: 'professional', label: 'Professional Details' },
  { key: 'account',      label: 'Account' },
  { key: 'security',     label: 'Security' },
];

function initialsOf(name: string | undefined): string {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{label}</p>
      <p className={`text-sm mt-0.5 ${value ? 'text-slate-800 font-medium' : 'text-slate-400 italic'}`}>
        {value || 'Not provided'}
      </p>
    </div>
  );
}

export default function ProfilePage() {
  const { session, updateUser } = useAuth();
  const user = session?.user;
  const role = (user?.role as UserRole | undefined);

  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [authErrorReason, setAuthErrorReason] = useState<AuthErrorReason | null>(null);
  const [tab, setTab] = useState<TabKey>('overview');

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarDataUrl, setAvatarDataUrl] = useState<string | null | undefined>(undefined);

  const load = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    setAuthErrorReason(null);
    try {
      const fresh = await profileService.getMe();
      updateUser(fresh);
    } catch (err: unknown) {
      const status = getHttpStatus(err);
      if (status === 401) setAuthErrorReason('sessionExpired');
      else if (status === 403) setAuthErrorReason('forbidden');
      else if (status && status >= 500) setAuthErrorReason('serverError');
      else setFetchError(extractErrorMessage(err, 'Failed to load your profile.'));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { load(); }, [load]);

  const beginEdit = () => {
    setFullName(user?.fullName ?? '');
    setPhone(user?.phone ?? '');
    setAvatarDataUrl(undefined);
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setAvatarDataUrl(undefined);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates: { fullName?: string; phone?: string; profilePicture?: string } = {
        fullName: fullName.trim(),
        phone: phone.trim(),
      };
      if (avatarDataUrl !== undefined) updates.profilePicture = avatarDataUrl ?? '';
      const fresh = await profileService.updateProfile(updates);
      updateUser(fresh);
      toast.success('Profile updated successfully.');
      setEditing(false);
      setAvatarDataUrl(undefined);
    } catch (err: unknown) {
      toast.error(extractErrorMessage(err, 'Failed to update your profile.'));
    } finally {
      setSaving(false);
    }
  };

  const displayName = user?.fullName?.trim() || user?.username || 'User';
  const initials = initialsOf(displayName);
  const avatarPreview = avatarDataUrl !== undefined ? avatarDataUrl : (user?.profilePicture || null);

  const profileFields = useMemo(() => (role ? ROLE_PROFILE_FIELDS[role] : []), [role]);
  const profileData = (user?.profile ?? {}) as Record<string, unknown>;

  if (loading) {
    return (
      <AppShell title="Profile">
        <div className="max-w-4xl mx-auto">
          <LoadingStateCard title="Loading your profile…" message="Fetching your account details." />
        </div>
      </AppShell>
    );
  }

  if (authErrorReason) {
    return (
      <AppShell title="Profile">
        <div className="max-w-4xl mx-auto">
          <AuthErrorCard reason={authErrorReason} onRetry={load} />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Profile">
      <div className="max-w-4xl mx-auto space-y-5 pb-10">

        {fetchError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
            <p className="text-sm text-red-700 flex-1">{fetchError}</p>
            <button
              type="button"
              onClick={load}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 text-xs font-semibold text-red-700 hover:bg-red-100 transition shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retry
            </button>
          </div>
        )}

        {/* Profile Header */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              {editing ? (
                <AvatarUploader
                  imageUrl={avatarPreview}
                  initials={initials}
                  onSelect={setAvatarDataUrl}
                />
              ) : avatarPreview ? (
                <img src={avatarPreview} alt="Profile avatar" className="w-16 h-16 rounded-full object-cover border border-gray-200 shrink-0" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white font-bold text-xl shrink-0">
                  {initials}
                </div>
              )}

              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-lg font-bold text-slate-800 truncate">{displayName}</h1>
                  {user?.isVerified && (
                    <span className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <BadgeCheck className="w-3.5 h-3.5" /> Verified
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-500 truncate">{user?.email}</p>
                {role && (
                  <span className="inline-block mt-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    {ROLE_DISPLAY_NAMES[role]}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {editing ? (
                <>
                  <button
                    type="button"
                    onClick={cancelEdit}
                    disabled={saving}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-slate-600 hover:bg-gray-50 transition disabled:opacity-60"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-sm font-semibold text-white transition disabled:opacity-60"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save changes
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={beginEdit}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-slate-600 hover:bg-gray-50 transition"
                >
                  <Pencil className="w-4 h-4" />
                  Edit Profile
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-1.5 flex flex-wrap gap-1">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition ${
                tab === key ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:bg-gray-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Overview */}
        {tab === 'overview' && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide flex items-center gap-2">
              <UserIcon className="w-4 h-4 text-slate-400" />
              Personal Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {editing ? (
                <>
                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide" htmlFor="fullName">Full Name</label>
                    <input
                      id="fullName"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Dr. Asha Verma"
                      className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide" htmlFor="phone">Phone Number</label>
                    <input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. +91 98765 43210"
                      className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    />
                  </div>
                </>
              ) : (
                <>
                  <Field label="Full Name" value={user?.fullName} />
                  <Field label="Phone Number" value={user?.phone} />
                </>
              )}
              <Field label="Email" value={user?.email} />
              <Field label="Username" value={user?.username} />
            </div>
            <p className="text-xs text-slate-400 pt-2 border-t border-gray-50 flex items-start gap-1.5">
              <Info className="w-3.5 h-3.5 shrink-0 mt-px" />
              Email and username are tied to your account and can't be changed here.
            </p>
          </div>
        )}

        {/* Professional Details */}
        {tab === 'professional' && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-slate-400" />
              {role ? `${ROLE_DISPLAY_NAMES[role]} Details` : 'Professional Details'}
            </h3>
            {profileFields.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {profileFields.map((field) => {
                  const raw = profileData[field.key];
                  const value = raw === undefined || raw === null || raw === '' ? null : String(raw);
                  return <Field key={field.key} label={field.label} value={value} />;
                })}
              </div>
            ) : (
              <EmptyStateCard
                icon={Briefcase}
                title="No role-specific details configured"
                description="This account type doesn't have any additional professional details to display."
              />
            )}
            <p className="text-xs text-slate-400 pt-2 border-t border-gray-50 flex items-start gap-1.5">
              <Info className="w-3.5 h-3.5 shrink-0 mt-px" />
              These details were collected during onboarding and are read-only here.
            </p>
          </div>
        )}

        {/* Account */}
        {tab === 'account' && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-slate-400" />
              Account Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Role" value={role ? ROLE_DISPLAY_NAMES[role] : null} />
              <Field label="Account Status" value={user?.status ? user.status.charAt(0).toUpperCase() + user.status.slice(1) : null} />
              <Field label="Sign-in Method" value={user?.authProvider === 'google' ? 'Google' : user?.authProvider === 'local' ? 'Email & Password' : null} />
              <Field label="Verification" value={user?.isVerified ? 'Verified' : 'Not verified'} />
              <Field label="Member Since" value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : null} />
              <Field label="Last Login" value={user?.lastLogin ? new Date(user.lastLogin).toLocaleString() : null} />
            </div>
          </div>
        )}

        {/* Security */}
        {tab === 'security' && <SecurityPanel authProvider={user?.authProvider} />}
      </div>
    </AppShell>
  );
}

function SecurityPanel({ authProvider }: { authProvider?: 'local' | 'google' }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isGoogleLinked = authProvider === 'google';
  const passwordsMismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;
  const newPasswordTooShort = newPassword.length > 0 && newPassword.length < 8;
  const canSubmit = !isGoogleLinked && currentPassword.length > 0 && newPassword.length >= 8 && newPassword === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await profileService.changePassword(currentPassword, newPassword);
      toast.success('Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      toast.error(extractErrorMessage(err, 'Failed to change your password.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
      <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide flex items-center gap-2">
        <Lock className="w-4 h-4 text-slate-400" />
        Change Password
      </h3>

      {isGoogleLinked ? (
        <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-6 py-8 text-center flex flex-col items-center gap-2">
          <Info className="w-5 h-5 text-slate-300" />
          <p className="text-sm text-slate-500">
            Your account signs in with Google — password changes aren't available for Google-linked accounts.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3 max-w-md">
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide" htmlFor="currentPassword">Current Password</label>
            <input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
              className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide" htmlFor="newPassword">New Password</label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
            {newPasswordTooShort && <p className="text-xs text-amber-600 mt-1">Password must be at least 8 characters.</p>}
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide" htmlFor="confirmPassword">Confirm New Password</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
            {passwordsMismatch && <p className="text-xs text-red-600 mt-1">Passwords do not match.</p>}
          </div>
          <button
            type="submit"
            disabled={!canSubmit || submitting}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-sm font-semibold text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
            Update Password
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-gray-50">
        <Field label="Sign-in Method" value={authProvider === 'google' ? 'Google' : 'Email & Password'} />
      </div>
    </div>
  );
}
