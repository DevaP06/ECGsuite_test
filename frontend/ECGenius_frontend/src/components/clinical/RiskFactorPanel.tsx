import type { AnswersMap } from '../../types/questionnaire';
import { CheckCircle, XCircle, HelpCircle } from 'lucide-react';

interface Props {
  answers: AnswersMap;
}

interface RiskFactor {
  id: string;
  label: string;
  category: 'medical' | 'lifestyle' | 'family';
}

const RISK_FACTORS: RiskFactor[] = [
  // Lifestyle
  { id: 'tobaccoUse',          label: 'Tobacco Use',                category: 'lifestyle' },
  { id: 'obesity',             label: 'Obesity',                    category: 'lifestyle' },
  { id: 'sedentaryLifestyle',  label: 'Sedentary Lifestyle',        category: 'lifestyle' },
  { id: 'chronicStress',       label: 'Chronic Stress',             category: 'lifestyle' },
  // Medical
  { id: 'hypertension',        label: 'Hypertension',               category: 'medical' },
  { id: 'diabetes',            label: 'Diabetes',                   category: 'medical' },
  { id: 'highCholesterol',     label: 'High Cholesterol',           category: 'medical' },
  { id: 'coronaryArteryDisease', label: 'Coronary Artery Disease',  category: 'medical' },
  { id: 'previousMI',          label: 'Previous Myocardial Infarction', category: 'medical' },
  { id: 'heartFailure',        label: 'Heart Failure',              category: 'medical' },
  { id: 'atrialFibrillation',  label: 'Atrial Fibrillation',        category: 'medical' },
  // Family history
  { id: 'familyHeartDisease',          label: 'Family Heart Disease',            category: 'family' },
  { id: 'familySuddenCardiacDeath',    label: 'Family Sudden Cardiac Death',     category: 'family' },
  { id: 'familyArrhythmia',            label: 'Family Arrhythmia',               category: 'family' },
  { id: 'familyCongenitalHeart',       label: 'Family Congenital Heart Disease', category: 'family' },
];

const CATEGORIES: { key: 'medical' | 'lifestyle' | 'family'; label: string }[] = [
  { key: 'medical',    label: 'Medical History' },
  { key: 'lifestyle',  label: 'Lifestyle Factors' },
  { key: 'family',     label: 'Family History' },
];

function getRiskStatus(value: AnswersMap[string]): 'present' | 'absent' | 'unknown' {
  if (value === null || value === undefined) return 'unknown';
  if (typeof value === 'boolean') return value ? 'present' : 'absent';
  if (typeof value === 'string') {
    const lower = value.toLowerCase();
    if (lower === 'true' || lower === 'yes' || lower === 'current' || lower === 'former') return 'present';
    if (lower === 'false' || lower === 'no' || lower === 'never') return 'absent';
  }
  return 'unknown';
}

export default function RiskFactorPanel({ answers }: Props) {
  const hasAnyAnswers = RISK_FACTORS.some((rf) => answers[rf.id] !== undefined);

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Risk Factors</h3>
        {!hasAnyAnswers && (
          <span className="text-xs text-slate-400 italic">No questionnaire data</span>
        )}
      </div>

      {CATEGORIES.map((cat) => {
        const factors = RISK_FACTORS.filter((rf) => rf.category === cat.key);
        return (
          <div key={cat.key} className="space-y-1.5">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider pb-0.5">
              {cat.label}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {factors.map((rf) => {
                const status = getRiskStatus(answers[rf.id]);
                return (
                  <div key={rf.id} className="flex items-center gap-2 text-sm">
                    {status === 'present' ? (
                      <CheckCircle className="w-4 h-4 text-red-500 shrink-0" />
                    ) : status === 'absent' ? (
                      <XCircle className="w-4 h-4 text-green-500 shrink-0" />
                    ) : (
                      <HelpCircle className="w-4 h-4 text-slate-300 shrink-0" />
                    )}
                    <span
                      className={
                        status === 'present'
                          ? 'text-slate-800 font-medium flex-1'
                          : status === 'absent'
                          ? 'text-slate-500 flex-1'
                          : 'text-slate-400 italic flex-1'
                      }
                    >
                      {rf.label}
                    </span>
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded shrink-0 ${
                        status === 'present'
                          ? 'bg-red-50 text-red-600'
                          : status === 'absent'
                          ? 'bg-green-50 text-green-600'
                          : 'bg-gray-50 text-gray-400'
                      }`}
                    >
                      {status === 'present' ? 'Present' : status === 'absent' ? 'Absent' : 'Unknown'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      <div className="flex items-center gap-4 pt-2 border-t border-gray-100 text-xs text-slate-400">
        <span className="flex items-center gap-1">
          <CheckCircle className="w-3 h-3 text-red-400" /> Present
        </span>
        <span className="flex items-center gap-1">
          <XCircle className="w-3 h-3 text-green-400" /> Absent
        </span>
        <span className="flex items-center gap-1">
          <HelpCircle className="w-3 h-3 text-slate-300" /> Unknown
        </span>
      </div>
    </div>
  );
}
