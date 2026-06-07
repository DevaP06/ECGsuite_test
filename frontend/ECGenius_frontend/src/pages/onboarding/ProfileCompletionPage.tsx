import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import OnboardingShell from '../../components/onboarding/OnboardingShell';
import { onboardingService } from '../../services/onboardingService';
import { useAuth } from '../../features/auth/useAuth';
import { getRole } from '../../features/auth/roleUtils';
import { extractErrorMessage } from '../../utils/errorUtils';
import { ROLE_DASHBOARD_ROUTES, ROLE_DISPLAY_NAMES } from '../../types/rbac';
import { ROLE_PROFILE_FIELDS } from '../../types/onboarding';
import type { OnboardingProfile } from '../../types/onboarding';

const EMPTY_PROFILE: OnboardingProfile = { fullName: '', phone: '' };

export default function ProfileCompletionPage() {
  const navigate = useNavigate();
  const { session, updateUser } = useAuth();

  const role = getRole();
  const roleFields = role ? ROLE_PROFILE_FIELDS[role] : [];

  const [form, setForm] = useState<OnboardingProfile>(() => ({
    ...EMPTY_PROFILE,
    fullName: session?.user?.username ?? '',
  }));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setField = (key: keyof OnboardingProfile, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const isComplete =
    form.fullName.trim().length > 0 &&
    form.phone.trim().length > 0 &&
    roleFields.every((f) => (form[f.key] ?? '').toString().trim().length > 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isComplete || submitting || !role) return;
    setSubmitting(true);
    setError(null);
    try {
      const user = await onboardingService.completeProfile(form);
      updateUser(user);
      navigate(ROLE_DASHBOARD_ROUTES[role]);
    } catch (err: unknown) {
      setError(extractErrorMessage(err, 'Could not save your profile. Please try again.'));
      setSubmitting(false);
    }
  };

  const renderField = (key: keyof OnboardingProfile, label: string, type: 'text' | 'number' | 'select', placeholder?: string, options?: string[]) => {
    const value = (form[key] ?? '') as string;
    if (type === 'select' && options) {
      return (
        <div key={key}>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">{label}</label>
          <select
            value={value}
            onChange={(e) => setField(key, e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-lg bg-gray-900 border border-gray-700 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          >
            <option value="" disabled>Select…</option>
            {options.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      );
    }
    return (
      <div key={key}>
        <label className="block text-xs font-medium text-gray-400 mb-1.5">{label}</label>
        <input
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={(e) => setField(key, e.target.value)}
          className="w-full px-3.5 py-2.5 rounded-lg bg-gray-900 border border-gray-700 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
        />
      </div>
    );
  };

  return (
    <OnboardingShell
      step={2}
      title="Complete your profile"
      subtitle={
        role
          ? `Just a few details so we can tailor ECGenius for you as a ${ROLE_DISPLAY_NAMES[role]}.`
          : 'Just a few details to finish setting up your account.'
      }
    >
      <form onSubmit={handleSubmit} className="w-full max-w-md bg-gray-900/50 border border-gray-700 rounded-2xl p-6 space-y-4">
        {renderField('fullName', 'Full Name', 'text', 'e.g. Dr. Asha Mehta')}
        {renderField('phone', 'Phone Number', 'text', 'e.g. +91 98765 43210')}

        {roleFields.map((f) => renderField(f.key, f.label, f.type, f.placeholder, f.options))}

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate('/onboarding/role')}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <button
            type="submit"
            disabled={!isComplete || submitting}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold bg-gradient-to-r from-blue-500 via-blue-400 to-cyan-400 hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {submitting ? 'Saving…' : 'Finish setup'}
          </button>
        </div>
      </form>
    </OnboardingShell>
  );
}
