import { CheckCircle } from 'lucide-react';

export interface StepDefinition {
  key: string;
  label: string;
}

interface QuestionStepperProps {
  steps: StepDefinition[];
  currentIndex: number;
  onStepClick?: (index: number) => void;
}

export default function QuestionStepper({ steps, currentIndex, onStepClick }: QuestionStepperProps) {
  return (
    <nav aria-label="Questionnaire progress" className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
      {steps.map((step, index) => {
        const isDone = index < currentIndex;
        const isActive = index === currentIndex;
        const clickable = !!onStepClick && index <= currentIndex;

        return (
          <div key={step.key} className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              aria-current={isActive ? 'step' : undefined}
              disabled={!clickable}
              onClick={() => onStepClick?.(index)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${
                isActive
                  ? 'bg-gradient-to-r from-blue-500 via-blue-400 to-cyan-400 text-white border-transparent'
                  : isDone
                  ? 'bg-blue-950/60 text-blue-300 border-blue-800/40'
                  : 'bg-gray-900/50 text-gray-500 border-gray-700'
              } ${clickable ? 'cursor-pointer' : 'cursor-default'}`}
            >
              {isDone ? <CheckCircle className="w-3.5 h-3.5" /> : <span>{index + 1}</span>}
              {step.label}
            </button>
            {index < steps.length - 1 && (
              <span className={`w-6 sm:w-8 h-px ${isDone ? 'bg-blue-400/60' : 'bg-gray-700'}`} />
            )}
          </div>
        );
      })}
    </nav>
  );
}
