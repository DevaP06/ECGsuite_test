import type { SignalMetrics } from '../../types/ecg';

interface MetricConfig {
  key: keyof SignalMetrics;
  label: string;
  unit: string;
  normalRange: string;
}

const METRIC_CONFIGS: MetricConfig[] = [
  { key: 'heartRate',    label: 'Heart Rate',    unit: 'bpm', normalRange: '60–100 bpm'  },
  { key: 'prInterval',   label: 'PR Interval',   unit: 'ms',  normalRange: '120–200 ms'  },
  { key: 'qrsDuration',  label: 'QRS Duration',  unit: 'ms',  normalRange: '70–120 ms'   },
  { key: 'qtInterval',   label: 'QT Interval',   unit: 'ms',  normalRange: '350–450 ms'  },
  { key: 'qtcInterval',  label: 'QTc',           unit: 'ms',  normalRange: '≤ 440 ms'    },
  { key: 'rrInterval',   label: 'RR Interval',   unit: 'ms',  normalRange: '600–1000 ms' },
];

interface MetricsGridProps {
  metrics?: SignalMetrics | null;
  loading?: boolean;
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 animate-pulse">
      <div className="h-3 w-20 bg-gray-200 rounded mb-3" />
      <div className="h-7 w-16 bg-gray-200 rounded mb-2" />
      <div className="h-2.5 w-24 bg-gray-100 rounded" />
    </div>
  );
}

export default function MetricsGrid({ metrics, loading }: MetricsGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {METRIC_CONFIGS.map((m) => <SkeletonCard key={m.key} />)}
      </div>
    );
  }

  const hasAny = metrics && Object.values(metrics).some((v) => v != null);

  if (!hasAny) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center">
        <p className="text-sm text-slate-500">Signal metrics not available for this analysis.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
      {METRIC_CONFIGS.map(({ key, label, unit, normalRange }) => {
        const raw = metrics?.[key];
        const value = raw != null ? raw : null;

        return (
          <div
            key={key}
            className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col gap-1"
          >
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</span>
            {value != null ? (
              <>
                <p className="text-2xl font-bold text-slate-800 leading-none">
                  {value}
                  <span className="text-sm font-normal text-slate-500 ml-1">{unit}</span>
                </p>
                <span className="text-xs text-slate-400">Normal: {normalRange}</span>
              </>
            ) : (
              <p className="text-sm text-slate-400 italic mt-1">N/A</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
