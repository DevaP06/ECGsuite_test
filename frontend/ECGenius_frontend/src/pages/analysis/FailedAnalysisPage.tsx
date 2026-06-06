import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Loader2, AlertTriangle, Upload, ArrowLeft, FileWarning, Download } from 'lucide-react';
import AppShell from '../../layouts/AppShell';
import { ecgService } from '../../services/ecgService';
import { extractErrorMessage } from '../../utils/errorUtils';
import { getDashboardRoute } from '../../features/auth/roleUtils';
import type { ECGAnalysis } from '../../types/ecg';

export default function FailedAnalysisPage() {
  const { analysisId } = useParams<{ analysisId: string }>();
  const dashboardPath = getDashboardRoute();

  const [analysis, setAnalysis] = useState<ECGAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!analysisId) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const ecg = await ecgService.getAnalysis(analysisId);
        if (cancelled) return;
        setAnalysis(ecg);
      } catch (err: unknown) {
        if (cancelled) return;
        setError(extractErrorMessage(err, 'Failed to load analysis details.'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [analysisId]);

  const handleDownloadReport = () => {
    if (!analysis) return;
    const lines = [
      'ECGenius — Analysis Failure Report',
      '═══════════════════════════════════════',
      `Analysis ID:    ${analysis._id}`,
      `Patient:        ${analysis.patientInfo.name}`,
      `Age:            ${analysis.patientInfo.age}`,
      `Gender:         ${analysis.patientInfo.gender}`,
      `Status:         ${analysis.status}`,
      `Failure Reason: ${analysis.failureReason ?? 'Unknown'}`,
      `Uploaded:       ${new Date(analysis.createdAt).toLocaleString()}`,
      '',
      'Please upload a new ECG or contact support at ecgenius.life@gmail.com',
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ecg-failure-${analysis._id.slice(-8)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <AppShell title="Analysis Failed">
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
          <p className="text-slate-600 font-semibold">Loading…</p>
        </div>
      </AppShell>
    );
  }

  if (error || !analysis) {
    return (
      <AppShell title="Analysis Failed">
        <div className="max-w-md mx-auto mt-10 bg-white border border-red-200 rounded-xl p-6 text-center shadow-sm">
          <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800 mb-1">Unable to load report</h3>
          <p className="text-sm text-slate-600 mb-5">{error ?? 'Analysis not found.'}</p>
          <Link
            to={dashboardPath}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition"
          >
            Return to Dashboard
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Analysis Failed">
      <div className="max-w-2xl mx-auto space-y-5 pb-10">

        {/* Back */}
        <Link
          to={dashboardPath}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-600 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        {/* Failure banner */}
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center space-y-3">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
              <FileWarning className="w-8 h-8 text-red-500" />
            </div>
          </div>
          <h1 className="text-xl font-bold text-red-700">ECG Analysis Failed</h1>
          <p className="text-sm text-red-600 max-w-sm mx-auto leading-relaxed">
            {analysis.failureReason ??
              'The analysis engine could not process this ECG. Please try uploading again with a clearer image.'}
          </p>
        </div>

        {/* Analysis details */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-6 py-5 space-y-3">
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Analysis Details</h3>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-2.5 text-sm">
            <div>
              <dt className="text-slate-500">Patient</dt>
              <dd className="font-semibold text-slate-800">{analysis.patientInfo.name}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Analysis ID</dt>
              <dd className="font-mono text-xs text-slate-600 break-all">{analysis._id}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Status</dt>
              <dd className="font-semibold text-red-600 capitalize">{analysis.status}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Uploaded At</dt>
              <dd className="text-slate-700">{new Date(analysis.createdAt).toLocaleString()}</dd>
            </div>
            {analysis.fileName && (
              <div className="col-span-2">
                <dt className="text-slate-500">File</dt>
                <dd className="font-mono text-xs text-slate-600 break-all">{analysis.fileName}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          <Link
            to="/ecgupload"
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-sm font-semibold text-white transition"
          >
            <Upload className="w-4 h-4" />
            Upload New ECG
          </Link>
          <Link
            to={dashboardPath}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-gray-200 text-sm font-semibold text-slate-600 hover:bg-gray-50 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Return to Dashboard
          </Link>
          <button
            type="button"
            onClick={handleDownloadReport}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-gray-200 text-sm font-semibold text-slate-600 hover:bg-gray-50 transition"
          >
            <Download className="w-4 h-4" />
            Download Failure Report
          </button>
        </div>

      </div>
    </AppShell>
  );
}
