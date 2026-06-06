import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ReferenceArea, ResponsiveContainer } from 'recharts';
import { Activity } from 'lucide-react';
import type { WaveformAnnotation } from '../../types/ecg';

interface ECGWaveformViewerProps {
  rawSignalData?: number[] | null;
  waveformAnnotations?: WaveformAnnotation | null;
}

const WAVE_CONFIG = [
  {
    key: 'pWave' as const,
    label: 'P-wave',
    color: '#3b82f6',
    fill: 'rgba(59,130,246,0.12)',
  },
  {
    key: 'qrs' as const,
    label: 'QRS Complex',
    color: '#ef4444',
    fill: 'rgba(239,68,68,0.12)',
  },
  {
    key: 'tWave' as const,
    label: 'T-wave',
    color: '#10b981',
    fill: 'rgba(16,185,129,0.12)',
  },
];

export default function ECGWaveformViewer({ rawSignalData, waveformAnnotations }: ECGWaveformViewerProps) {
  const hasAnnotations = waveformAnnotations &&
    Object.values(waveformAnnotations).some((v) => v != null);

  const hasSignal = rawSignalData && rawSignalData.length > 0;

  if (!hasAnnotations && !hasSignal) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-4 h-4 text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-700">Waveform Explainability</h3>
        </div>
        <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-6 py-10 text-center">
          <Activity className="w-8 h-8 text-gray-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-500">Waveform explainability not available.</p>
          <p className="text-xs text-slate-400 mt-1">
            P-wave, QRS, and T-wave highlight regions will appear here when the backend provides attribution data.
          </p>
        </div>
      </div>
    );
  }

  // Build chart data from raw signal
  const chartData = hasSignal
    ? rawSignalData.map((value, index) => ({ index, value }))
    : [];

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-500" />
          <h3 className="text-sm font-semibold text-slate-800">Waveform Explainability</h3>
        </div>
        {/* Legend */}
        <div className="flex items-center gap-4">
          {WAVE_CONFIG.map((w) => {
            const ann = waveformAnnotations?.[w.key];
            if (!ann) return null;
            return (
              <div key={w.key} className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: w.fill, border: `1.5px solid ${w.color}` }} />
                <span className="text-xs text-slate-500">{w.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Annotations summary if no raw signal */}
      {!hasSignal && hasAnnotations && (
        <div className="space-y-3">
          <p className="text-xs text-slate-500 mb-3">
            Raw signal data not provided. Displaying annotation regions only.
          </p>
          <div className="grid grid-cols-3 gap-3">
            {WAVE_CONFIG.map((w) => {
              const ann = waveformAnnotations?.[w.key];
              if (!ann) return null;
              return (
                <div key={w.key} className="rounded-lg border p-3 text-xs" style={{ borderColor: w.color + '66', backgroundColor: w.fill }}>
                  <p className="font-semibold mb-1" style={{ color: w.color }}>{w.label}</p>
                  {ann.startIdx != null && <p className="text-slate-600">Start: sample {ann.startIdx}</p>}
                  {ann.endIdx != null && <p className="text-slate-600">End: sample {ann.endIdx}</p>}
                  {ann.confidence != null && (
                    <p className="text-slate-600">Attribution: {Math.round(ann.confidence * 100)}%</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Chart with highlighted regions */}
      {hasSignal && (
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="index" tick={{ fontSize: 10 }} stroke="#cbd5e1" />
            <YAxis tick={{ fontSize: 10 }} stroke="#cbd5e1" />
            <Tooltip
              contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e2e8f0' }}
              formatter={(v: number) => [v.toFixed(3), 'mV']}
              labelFormatter={(l) => `Sample ${l}`}
            />

            {WAVE_CONFIG.map((w) => {
              const ann = waveformAnnotations?.[w.key];
              if (!ann || ann.startIdx == null || ann.endIdx == null) return null;
              return (
                <ReferenceArea
                  key={w.key}
                  x1={ann.startIdx}
                  x2={ann.endIdx}
                  fill={w.fill}
                  stroke={w.color}
                  strokeOpacity={0.5}
                />
              );
            })}

            {/* Zero baseline */}
            <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="4 4" />

            <Line
              type="monotone"
              dataKey="value"
              stroke="#3b82f6"
              strokeWidth={1.5}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
