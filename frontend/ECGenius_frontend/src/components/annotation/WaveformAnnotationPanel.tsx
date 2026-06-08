import { useState, useMemo } from 'react';
import {
  Activity, Plus, Trash2, Info, Eye, EyeOff,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import type { ExplanationData, WaveformAnnotation } from '../../types/ecg';
import type { WaveformMark, AnnotationLabel } from '../../types/annotation';

interface Props {
  explanation?: ExplanationData | null;
  onMarksUpdate?: (marks: WaveformMark[]) => void;
}

interface SignalPoint {
  idx: number;
  mv: number;
}

interface MarkForm {
  label: AnnotationLabel;
  lead: string;
  startSample: string;
  endSample: string;
  comment: string;
}

export const ECG_LEADS = ['I', 'II', 'III', 'aVR', 'aVL', 'aVF', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6'];

const LABEL_OPTIONS: { value: AnnotationLabel; label: string; color: string }[] = [
  { value: 'p_wave',        label: 'P Wave',        color: 'text-blue-600'   },
  { value: 'qrs_complex',   label: 'QRS Complex',   color: 'text-purple-600' },
  { value: 't_wave',        label: 'T Wave',        color: 'text-emerald-600'},
  { value: 'st_elevation',  label: 'ST Elevation',  color: 'text-red-600'    },
  { value: 'st_depression', label: 'ST Depression', color: 'text-amber-600'  },
  { value: 'u_wave',        label: 'U Wave',        color: 'text-teal-600'   },
  { value: 'artifact',      label: 'Artifact',      color: 'text-gray-500'   },
  { value: 'ectopic_beat',  label: 'Ectopic Beat',  color: 'text-orange-600' },
  { value: 'other',         label: 'Other',         color: 'text-slate-600'  },
];

const LABEL_COLOR: Record<AnnotationLabel, string> = {
  p_wave:        'bg-blue-50 text-blue-700 border-blue-200',
  qrs_complex:   'bg-purple-50 text-purple-700 border-purple-200',
  t_wave:        'bg-emerald-50 text-emerald-700 border-emerald-200',
  st_elevation:  'bg-red-50 text-red-700 border-red-200',
  st_depression: 'bg-amber-50 text-amber-700 border-amber-200',
  u_wave:        'bg-teal-50 text-teal-700 border-teal-200',
  artifact:      'bg-gray-50 text-gray-600 border-gray-200',
  ectopic_beat:  'bg-orange-50 text-orange-700 border-orange-200',
  other:         'bg-slate-50 text-slate-600 border-slate-200',
};

const BLANK_FORM: MarkForm = { label: 'p_wave', lead: 'II', startSample: '', endSample: '', comment: '' };

function buildSignalPoints(rawSignalData: number[]): SignalPoint[] {
  const MAX_POINTS = 600;
  const step = rawSignalData.length > MAX_POINTS
    ? Math.ceil(rawSignalData.length / MAX_POINTS)
    : 1;
  const points: SignalPoint[] = [];
  for (let i = 0; i < rawSignalData.length; i += step) {
    points.push({ idx: i, mv: rawSignalData[i] });
  }
  return points;
}

function WaveInfo({ label, data }: { label: string; data?: { startIdx?: number; endIdx?: number; confidence?: number } }) {
  if (!data) return null;
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="font-semibold text-slate-600 w-24">{label}</span>
      <span className="text-slate-500">
        {data.startIdx !== undefined ? `Start: ${data.startIdx}` : ''}
        {data.startIdx !== undefined && data.endIdx !== undefined ? ' → ' : ''}
        {data.endIdx !== undefined ? `End: ${data.endIdx}` : ''}
        {data.confidence !== undefined ? ` (conf: ${(data.confidence * 100).toFixed(0)}%)` : ''}
      </span>
    </div>
  );
}

function AiAnnotationDisplay({ waveformAnnotations }: { waveformAnnotations: WaveformAnnotation }) {
  return (
    <div className="space-y-1.5 bg-blue-50 border border-blue-100 rounded-lg px-4 py-3">
      <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-2">
        AI-Detected Waveform Positions
      </p>
      <WaveInfo label="P Wave"    data={waveformAnnotations.pWave} />
      <WaveInfo label="QRS Complex" data={waveformAnnotations.qrs} />
      <WaveInfo label="T Wave"    data={waveformAnnotations.tWave} />
      {!waveformAnnotations.pWave && !waveformAnnotations.qrs && !waveformAnnotations.tWave && (
        <p className="text-xs text-blue-500 italic">No waveform position data from AI.</p>
      )}
    </div>
  );
}

export default function WaveformAnnotationPanel({ explanation, onMarksUpdate }: Props) {
  const [marks, setMarks]     = useState<WaveformMark[]>([]);
  const [form, setForm]       = useState<MarkForm>(BLANK_FORM);
  const [showForm, setShowForm] = useState(false);
  const [visibleLeads, setVisibleLeads] = useState<Set<string> | null>(null);

  const updateMarks = (next: WaveformMark[]) => {
    setMarks(next);
    onMarksUpdate?.(next);
  };

  const addMark = () => {
    const start = parseInt(form.startSample, 10);
    const end   = parseInt(form.endSample, 10);
    if (isNaN(start) || isNaN(end) || end < start) return;
    const newMark: WaveformMark = {
      label: form.label,
      lead: form.lead,
      startSample: start,
      endSample: end,
      comment: form.comment || undefined,
    };
    updateMarks([...marks, newMark]);
    setForm(BLANK_FORM);
    setShowForm(false);
  };

  const removeMark = (idx: number) => {
    updateMarks(marks.filter((_, i) => i !== idx));
  };

  const markedLeads = useMemo(
    () => Array.from(new Set(marks.map((m) => m.lead ?? 'unspecified'))),
    [marks],
  );

  const isLeadVisible = (lead: string) => visibleLeads === null || visibleLeads.has(lead);

  const toggleLeadVisibility = (lead: string) => {
    setVisibleLeads((current) => {
      const base = current ?? new Set(markedLeads);
      const next = new Set(base);
      if (next.has(lead)) next.delete(lead);
      else next.add(lead);
      return next;
    });
  };

  const visibleMarks = marks
    .map((mark, idx) => ({ mark, idx }))
    .filter(({ mark }) => isLeadVisible(mark.lead ?? 'unspecified'));

  const signalPoints = explanation?.rawSignalData
    ? buildSignalPoints(explanation.rawSignalData)
    : null;

  const hasAiAnnotations = !!(
    explanation?.waveformAnnotations?.pWave ||
    explanation?.waveformAnnotations?.qrs ||
    explanation?.waveformAnnotations?.tWave
  );

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-500" />
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
            Waveform Annotation
          </h3>
        </div>
        {marks.length > 0 && (
          <span className="text-xs font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
            {marks.length} mark{marks.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Raw signal chart */}
      {signalPoints && signalPoints.length > 0 ? (
        <div>
          <p className="text-xs text-slate-500 mb-2">ECG Signal Preview</p>
          <div className="h-28 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={signalPoints} margin={{ top: 2, right: 4, left: -20, bottom: 2 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="idx" hide />
                <YAxis domain={['auto', 'auto']} tick={{ fontSize: 9 }} />
                <Tooltip
                  formatter={(val: number) => [val.toFixed(4), 'mV']}
                  labelFormatter={(label: number) => `Sample ${label}`}
                  contentStyle={{ fontSize: 11 }}
                />
                <Line
                  type="monotone"
                  dataKey="mv"
                  stroke="#3b82f6"
                  dot={false}
                  strokeWidth={1}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Showing {signalPoints.length} of {explanation!.rawSignalData!.length} samples
          </p>
        </div>
      ) : (
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
          <Info className="w-4 h-4 text-slate-400 shrink-0" />
          <p className="text-xs text-slate-500">
            Waveform signal data not provided by backend. Annotations are text-based only.
          </p>
        </div>
      )}

      {/* AI-detected annotations */}
      {hasAiAnnotations && explanation?.waveformAnnotations && (
        <AiAnnotationDisplay waveformAnnotations={explanation.waveformAnnotations} />
      )}

      {/* Cardiologist marks list */}
      {marks.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
              Your Marks
            </p>
            {markedLeads.length > 1 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs text-slate-400">Show leads:</span>
                {markedLeads.map((lead) => {
                  const visible = isLeadVisible(lead);
                  return (
                    <button
                      key={lead}
                      type="button"
                      onClick={() => toggleLeadVisibility(lead)}
                      className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border transition ${
                        visible
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-gray-50 text-gray-400 border-gray-200'
                      }`}
                    >
                      {visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      {lead}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {visibleMarks.length === 0 ? (
            <p className="text-xs text-slate-400 italic px-1">No marks visible for the selected leads.</p>
          ) : (
            visibleMarks.map(({ mark, idx }) => {
              const opt = LABEL_OPTIONS.find((o) => o.value === mark.label);
              return (
                <div
                  key={idx}
                  className="flex items-center gap-2 bg-white border border-gray-100 rounded-lg px-3 py-2"
                >
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full border bg-slate-50 text-slate-600 border-slate-200">
                    {mark.lead ?? 'Unspecified'}
                  </span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${LABEL_COLOR[mark.label]}`}>
                    {opt?.label ?? mark.label}
                  </span>
                  <span className="text-xs text-slate-500 flex-1">
                    {mark.startSample} → {mark.endSample}
                    {mark.comment && ` · ${mark.comment}`}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeMark(idx)}
                    className="p-1 rounded hover:bg-red-50 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Add mark form */}
      {showForm && (
        <div className="border border-blue-200 rounded-lg p-4 bg-blue-50 space-y-3">
          <p className="text-xs font-semibold text-blue-700">Add Waveform Mark</p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-semibold text-slate-600">Mark Type</label>
              <select
                value={form.label}
                onChange={(e) => setForm((f) => ({ ...f, label: e.target.value as AnnotationLabel }))}
                className="w-full mt-1 border border-slate-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {LABEL_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600">Lead</label>
              <select
                value={form.lead}
                onChange={(e) => setForm((f) => ({ ...f, lead: e.target.value }))}
                className="w-full mt-1 border border-slate-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {ECG_LEADS.map((lead) => (
                  <option key={lead} value={lead}>{lead}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600">Start Sample</label>
              <input
                type="number"
                value={form.startSample}
                onChange={(e) => setForm((f) => ({ ...f, startSample: e.target.value }))}
                placeholder="0"
                className="w-full mt-1 border border-slate-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600">End Sample</label>
              <input
                type="number"
                value={form.endSample}
                onChange={(e) => setForm((f) => ({ ...f, endSample: e.target.value }))}
                placeholder="100"
                className="w-full mt-1 border border-slate-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-semibold text-slate-600">Comment (optional)</label>
              <input
                type="text"
                value={form.comment}
                onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value }))}
                placeholder="Describe the observation…"
                className="w-full mt-1 border border-slate-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={addMark}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition"
            >
              <Plus className="w-3.5 h-3.5" /> Add Mark
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setForm(BLANK_FORM); }}
              className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-slate-600 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {!showForm && (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 transition"
        >
          <Plus className="w-3.5 h-3.5" /> Add Waveform Mark
        </button>
      )}
    </div>
  );
}
