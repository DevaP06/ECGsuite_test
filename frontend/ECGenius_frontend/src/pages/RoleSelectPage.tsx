// TEMPORARY UNTIL BACKEND ROLE MANAGEMENT IS AVAILABLE
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Stethoscope, Heart, User, CheckCircle } from 'lucide-react';
import { setLocalRole, getDashboardRoute } from '../features/auth/roleUtils';
import type { UserRole } from '../types/rbac';

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

export default function RoleSelectPage() {
  const [selected, setSelected] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleConfirm = () => {
    if (!selected) return;
    setLoading(true);
    setLocalRole(selected);
    navigate(getDashboardRoute());
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-4 py-12">
      {/* Header */}
      <div className="mb-10 text-center max-w-lg">
        <div className="inline-flex items-center gap-2 bg-blue-950/60 border border-blue-800/40 rounded-full px-4 py-1.5 text-xs text-blue-300 font-medium mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block" />
          Temporary — backend role management coming soon
        </div>
        <h1 className="text-3xl font-bold mb-3">Who are you?</h1>
        <p className="text-gray-400 text-sm leading-relaxed">
          Select your role to access your personalised ECGenius dashboard. This selection
          determines what you can see and do on the platform.
        </p>
      </div>

      {/* Role cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full max-w-3xl">
        {roleOptions.map((opt) => {
          const isSelected = selected === opt.role;
          return (
            <button
              key={opt.role}
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

              <div
                className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${opt.accent} mb-4 text-white`}
              >
                {opt.icon}
              </div>

              <h3 className="text-lg font-bold text-white mb-1.5">{opt.label}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{opt.description}</p>
            </button>
          );
        })}
      </div>

      {/* Confirm button */}
      <div className="mt-10 w-full max-w-xs">
        <button
          onClick={handleConfirm}
          disabled={!selected || loading}
          className="w-full py-3 rounded-xl font-semibold bg-gradient-to-r from-blue-500 via-blue-400 to-cyan-400 hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm"
        >
          {loading ? 'Redirecting…' : 'Continue to Dashboard'}
        </button>
        {!selected && (
          <p className="text-center text-xs text-gray-600 mt-2">Select a role to continue</p>
        )}
      </div>
    </div>
  );
}
