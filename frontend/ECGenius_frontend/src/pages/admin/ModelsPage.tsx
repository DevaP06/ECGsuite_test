import { useState, useEffect, useCallback, type FormEvent } from 'react';
import toast from 'react-hot-toast';
import { Cpu, Loader2, AlertTriangle, RefreshCw, Plus, CheckCircle2, X } from 'lucide-react';
import AppShell from '../../layouts/AppShell';
import { adminService } from '../../services/adminService';
import { extractErrorMessage } from '../../utils/errorUtils';
import type { ModelVersion, CreateModelPayload } from '../../types/admin';

const EMPTY_FORM: CreateModelPayload = { name: '', version: '', framework: '', description: '', accuracy: undefined };

export default function ModelsPage() {
  const [models, setModels] = useState<ModelVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activatingId, setActivatingId] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CreateModelPayload>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchModels = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setModels(await adminService.getModels());
    } catch (err: unknown) {
      setError(extractErrorMessage(err, 'Failed to load model versions.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchModels(); }, [fetchModels]);

  const handleActivate = async (model: ModelVersion) => {
    if (model.active) return;
    if (!window.confirm(`Activate ${model.name} v${model.version}? This will deactivate the current production model.`)) {
      return;
    }
    setActivatingId(model._id);
    try {
      await adminService.activateModel(model._id);
      toast.success(`${model.name} v${model.version} is now active.`);
      await fetchModels();
    } catch (err: unknown) {
      toast.error(extractErrorMessage(err, 'Failed to activate model.'));
    } finally {
      setActivatingId(null);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!form.name.trim() || !form.version.trim()) {
      setFormError('Name and version are required.');
      return;
    }
    if (form.accuracy !== undefined && (Number.isNaN(form.accuracy) || form.accuracy < 0 || form.accuracy > 100)) {
      setFormError('Accuracy must be a number between 0 and 100.');
      return;
    }

    setSubmitting(true);
    try {
      const payload: CreateModelPayload = {
        name: form.name.trim(),
        version: form.version.trim(),
        ...(form.framework?.trim() ? { framework: form.framework.trim() } : {}),
        ...(form.description?.trim() ? { description: form.description.trim() } : {}),
        ...(form.accuracy !== undefined ? { accuracy: form.accuracy } : {}),
      };
      await adminService.createModel(payload);
      toast.success(`${payload.name} v${payload.version} registered.`);
      setForm(EMPTY_FORM);
      setShowForm(false);
      await fetchModels();
    } catch (err: unknown) {
      setFormError(extractErrorMessage(err, 'Failed to register model version.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell title="Models">
      <div className="space-y-5 pb-10">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center">
              <Cpu className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">Model Versions</h1>
              <p className="text-xs text-slate-500">{models.length} version{models.length !== 1 ? 's' : ''} registered</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchModels}
              disabled={loading}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 border border-gray-200 rounded-lg px-3 py-2 transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              type="button"
              onClick={() => { setShowForm((v) => !v); setFormError(null); }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-sm font-semibold text-white transition"
            >
              {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {showForm ? 'Cancel' : 'Register Model'}
            </button>
          </div>
        </div>

        {/* Register form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
            <h3 className="text-sm font-semibold text-slate-700">Register new model version</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="ECG-CNN"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Version *</label>
                <input
                  type="text"
                  value={form.version}
                  onChange={(e) => setForm((f) => ({ ...f, version: e.target.value }))}
                  placeholder="1.0.0"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Framework</label>
                <input
                  type="text"
                  value={form.framework}
                  onChange={(e) => setForm((f) => ({ ...f, framework: e.target.value }))}
                  placeholder="TensorFlow"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Accuracy (%)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  value={form.accuracy ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, accuracy: e.target.value === '' ? undefined : Number(e.target.value) }))}
                  placeholder="92.5"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-500 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={2}
                  placeholder="Short description of this model version"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
                />
              </div>
            </div>

            {formError && (
              <p className="text-sm text-red-600 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" /> {formError}
              </p>
            )}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => { setShowForm(false); setForm(EMPTY_FORM); setFormError(null); }}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-sm font-semibold text-white transition disabled:opacity-50"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Register
              </button>
            </div>
          </form>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[30vh] gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-sm text-slate-500">Loading model versions…</p>
          </div>
        ) : error ? (
          <div className="max-w-md mx-auto mt-6 bg-white border border-red-200 rounded-xl p-6 text-center shadow-sm">
            <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <h3 className="text-base font-bold text-slate-800 mb-1">Failed to load models</h3>
            <p className="text-sm text-slate-600 mb-4">{error}</p>
            <button
              onClick={fetchModels}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition"
            >
              <RefreshCw className="w-4 h-4" /> Retry
            </button>
          </div>
        ) : models.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-gray-200 p-10 text-center">
            <Cpu className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-700 mb-1">No model versions registered</h3>
            <p className="text-sm text-slate-500">Register the first model version to get started.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Model</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide hidden sm:table-cell">Framework</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide hidden md:table-cell">Accuracy</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Deployed</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {models.map((m) => (
                  <tr key={m._id} className="hover:bg-blue-50/30 transition">
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-slate-800">{m.name}</p>
                      <p className="text-xs text-slate-500">v{m.version}{m.description ? ` · ${m.description}` : ''}</p>
                    </td>
                    <td className="px-4 py-3.5 hidden sm:table-cell text-slate-600">{m.framework ?? '—'}</td>
                    <td className="px-4 py-3.5 hidden md:table-cell text-slate-600">{m.accuracy != null ? `${m.accuracy}%` : '—'}</td>
                    <td className="px-4 py-3.5">
                      {m.active ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                          <CheckCircle2 className="w-3 h-3" /> Active
                        </span>
                      ) : (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-50 text-slate-500">Inactive</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 hidden lg:table-cell text-slate-500 text-xs">
                      {m.deployedAt ? new Date(m.deployedAt).toLocaleString() : '—'}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      {!m.active && (
                        <button
                          type="button"
                          onClick={() => handleActivate(m)}
                          disabled={activatingId === m._id}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white transition disabled:opacity-50 ml-auto"
                        >
                          {activatingId === m._id && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                          Activate
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
}
