import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, Info } from 'lucide-react';
import type { ECGAnalysis } from '../../types/ecg';

interface Props {
  analyses: ECGAnalysis[];
}

// Only metrics the backend provides — no frontend calculations
interface DataPoint {
  date: string;        // display label
  heartRate: number | null;
  qrsDuration: number | null;
  qtInterval: number | null;
  confidence: number | null;
}

function toDataPoints(analyses: ECGAnalysis[]): DataPoint[] {
  return analyses
    .filter((a) => a.status === 'completed' && a.analysisResult !== null)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .map((a) => ({
      date: new Date(a.createdAt).toLocaleDateString(undefined, {
        month: 'short', day: 'numeric',
      }),
      heartRate:   a.analysisResult?.heartRate   ?? null,
      qrsDuration: a.analysisResult?.qrsDuration ?? null,
      qtInterval:  a.analysisResult?.qtInterval  ?? null,
      confidence:  a.analysisResult?.confidence  ?? null,
    }));
}

const LINES: {
  key: keyof Omit<DataPoint, 'date'>;
  label: string;
  color: string;
  unit: string;
}[] = [
  { key: 'heartRate',   label: 'Heart Rate',   color: '#3b82f6', unit: 'bpm' },
  { key: 'qrsDuration', label: 'QRS Duration', color: '#8b5cf6', unit: 'ms'  },
  { key: 'qtInterval',  label: 'QT Interval',  color: '#10b981', unit: 'ms'  },
  { key: 'confidence',  label: 'Confidence',   color: '#f59e0b', unit: '%'   },
];

interface TooltipPayloadEntry {
  name: string;
  value: number | null;
  color: string;
}

interface CustomTooltipProps {
  active?: boolean;
  label?: string;
  payload?: TooltipPayloadEntry[];
}

function CustomTooltip({ active, label, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3 text-xs space-y-1">
      <p className="font-semibold text-slate-700 mb-1">{label}</p>
      {payload.map((entry) => {
        if (entry.value === null) return null;
        const line = LINES.find((l) => l.label === entry.name);
        return (
          <p key={entry.name} style={{ color: entry.color }}>
            {entry.name}: <span className="font-semibold">{entry.value} {line?.unit ?? ''}</span>
          </p>
        );
      })}
    </div>
  );
}

export default function TrendAnalytics({ analyses }: Props) {
  const data = toDataPoints(analyses);

  if (data.length < 2) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-blue-500" />
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Trend Analytics</h3>
        </div>
        <div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
          <Info className="w-8 h-8 text-slate-300" />
          <p className="text-sm text-slate-500">
            {data.length === 0
              ? 'No completed analyses to display.'
              : 'At least two completed analyses are needed to show trends.'}
          </p>
          <p className="text-xs text-slate-400">Trends will appear automatically as more ECGs are analyzed.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
      <div className="flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-blue-500" />
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Trend Analytics</h3>
        <span className="ml-auto text-xs text-slate-400">{data.length} data point{data.length !== 1 ? 's' : ''}</span>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data} margin={{ top: 4, right: 20, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            axisLine={false}
            tickLine={false}
            width={36}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
          />
          {LINES.map((l) => (
            <Line
              key={l.key}
              type="monotone"
              dataKey={l.key}
              name={l.label}
              stroke={l.color}
              strokeWidth={2}
              dot={{ r: 3, strokeWidth: 0 }}
              activeDot={{ r: 5 }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>

      <p className="text-xs text-slate-400">
        All values are backend-provided from ECG analysis results. No frontend calculations applied.
      </p>
    </div>
  );
}
