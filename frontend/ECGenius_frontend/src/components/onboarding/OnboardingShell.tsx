import { CheckCircle } from 'lucide-react';

interface OnboardingShellProps {
  step: 1 | 2;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

const STEPS = [
  { n: 1, label: 'Choose role' },
  { n: 2, label: 'Complete profile' },
];

export default function OnboardingShell({ step, title, subtitle, children }: OnboardingShellProps) {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-4 py-12">
      {/* Brand */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-950/60 border border-blue-800/40 rounded-full px-4 py-1.5 text-xs text-blue-300 font-medium mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block" />
          Welcome to ECGenius — let's set up your account
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-3 mb-6">
          {STEPS.map((s, i) => {
            const isDone = step > s.n;
            const isActive = step === s.n;
            return (
              <div key={s.n} className="flex items-center gap-3">
                <div
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-500 via-blue-400 to-cyan-400 text-white border-transparent'
                      : isDone
                      ? 'bg-blue-950/60 text-blue-300 border-blue-800/40'
                      : 'bg-gray-900/50 text-gray-500 border-gray-700'
                  }`}
                >
                  {isDone ? <CheckCircle className="w-3.5 h-3.5" /> : <span>{s.n}</span>}
                  {s.label}
                </div>
                {i < STEPS.length - 1 && (
                  <span className={`w-8 h-px ${step > s.n ? 'bg-blue-400/60' : 'bg-gray-700'}`} />
                )}
              </div>
            );
          })}
        </div>

        <h1 className="text-3xl font-bold mb-2">{title}</h1>
        <p className="text-gray-400 text-sm leading-relaxed max-w-lg mx-auto">{subtitle}</p>
      </div>

      {children}
    </div>
  );
}
