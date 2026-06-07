import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Stethoscope, Heart, User, CheckCircle, Loader2 } from 'lucide-react';
import OnboardingShell from '../../components/onboarding/OnboardingShell';
import { onboardingService } from '../../services/onboardingService';
import { useAuth } from '../../features/auth/useAuth';
import { extractErrorMessage } from '../../utils/errorUtils';
import type { UserRole } from '../../types/rbac';

interface RoleOption {
  role: UserRole;
  label: string;
  description: string;
  icon: React.ReactNode;
  accent: string;
  border: string;
}

const roleOptions: RoleOption[] = [
  {
    role: 'PHC_DOCTOR',
    label: 'PHC Doctor',
    description: 'Upload ECGs, manage patients, and request specialist reviews.',
    icon: <Stethoscope className="w-8 h-8" />,
    accent: 'from-blue-500 to-blue-600',
    border: 'border-blue-500',
  },
  {
    role: 'CARDIOLOGIST',
    label: 'Cardiologist',
    description: 'Review referred cases, override AI diagnoses, and provide expert guidance.',
    icon: <Heart className="w-8 h-8" />,
    accent: 'from-red-500 to-rose-600',
    border: 'border-red-500',
  },
  {
    role: 'PATIENT',
    label: 'Patient',
    description: 'Upload your ECGs, view AI reports, and track your heart health over time.',
    icon: <User className="w-8 h-8" />,
    accent: 'from-emerald-500 to-teal-600',
    border: 'border-emerald-500',
  },
];

// Admin accounts are provisioned out-of-band (not via self-service signup).
// Extension point: flip this to a permission check once an admin-invite system exists.
const SHOW_ADMIN_CARD = false;

export default function RoleSelectionPage() {
  const navigate = useNavigate();
  const { updateUser } = useAuth();

  const [selected, setSelected] = useState<UserRole | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const visibleOptions = SHOW_ADMIN_CARD
    ? roleOptions
    : roleOptions.filter((opt) => opt.role !== 'ADMIN');

  const handleConfirm = async () => {
    if (!selected || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const user = await onboardingService.selectRole(selected);
      updateUser(user);
      navigate('/onboarding/profile');
    } catch (err: unknown) {
      setError(extractErrorMessage(err, 'Could not save your role. Please try again.'));
      setSubmitting(false);
    }
  };

  return (
    <OnboardingShell
      step={1}
      title="Who are you?"
      subtitle="Select your role to set up your personalised ECGenius workspace. This determines what you can see and do on the platform."
    >
      {/* Role cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full max-w-3xl">
        {visibleOptions.map((opt) => {
          const isSelected = selected === opt.role;
          return (
            <button
              key={opt.role}
              type="button"
              onClick={() => setSelected(opt.role)}
              className={`relative group text-left rounded-2xl border p-6 transition-all duration-200 focus:outline-none ${
                isSelected
                  ? `${opt.border} bg-gray-900 shadow-xl shadow-blue-900/20 scale-[1.02]`
                  : 'border-gray-700 bg-gray-900/50 hover:border-gray-500 hover:bg-gray-900'
              }`}
            >
              {isSelected && (
                <span className="absolute top-4 right-4 text-blue-400">
                  <CheckCircle className="w-5 h-5" />
                </span>
              )}

              <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${opt.accent} mb-4 text-white`}>
                {opt.icon}
              </div>

              <h3 className="text-lg font-bold text-white mb-1.5">{opt.label}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{opt.description}</p>
            </button>
          );
        })}
      </div>

      {error && (
        <p className="mt-6 text-sm text-red-400 text-center max-w-md">{error}</p>
      )}

      {/* Confirm button */}
      <div className="mt-8 w-full max-w-xs">
        <button
          type="button"
          onClick={handleConfirm}
          disabled={!selected || submitting}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold bg-gradient-to-r from-blue-500 via-blue-400 to-cyan-400 hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm"
        >
          {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {submitting ? 'Saving…' : 'Continue'}
        </button>
        {!selected && (
          <p className="text-center text-xs text-gray-600 mt-2">Select a role to continue</p>
        )}
      </div>
    </OnboardingShell>
  );
}
