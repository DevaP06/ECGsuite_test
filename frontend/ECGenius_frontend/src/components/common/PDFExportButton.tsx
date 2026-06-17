import { useState } from 'react';
import { FileDown, Loader2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import AxiosInstance from '../../AxiosInstance';

interface PDFExportButtonProps {
  analysisId: string;
  patientName?: string;
  variant?: 'button' | 'icon';
}

export default function PDFExportButton({ analysisId, patientName, variant = 'button' }: PDFExportButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    if (loading) return;
    setLoading(true);

    try {
      const response = await AxiosInstance.get(`/api/ecg/analysis/${analysisId}/report`, {
        responseType: 'blob',
      });

      const contentType = String(response.headers['content-type'] ?? 'application/pdf');
      const blob = new Blob([response.data], { type: contentType });
      const url = URL.createObjectURL(blob);

      const filename = patientName
        ? `ECGenius_Report_${patientName.replace(/\s+/g, '_')}_${analysisId.slice(-6)}.pdf`
        : `ECGenius_Report_${analysisId}.pdf`;

      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);

      toast.success('Clinical report downloaded.');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number } };
      if (axiosErr?.response?.status === 404) {
        toast.error('Report not available for this analysis yet.');
      } else {
        toast.error('Failed to download report. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (variant === 'icon') {
    return (
      <button
        onClick={handleExport}
        disabled={loading}
        className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 transition"
        aria-label="Download clinical report PDF"
        title="Download PDF Report"
      >
        {loading
          ? <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
          : <FileDown className="w-4 h-4 text-slate-600" />
        }
      </button>
    );
  }

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-sm font-medium text-slate-700 shadow-sm disabled:opacity-50 transition"
      aria-label="Download clinical report PDF"
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
          <span>Generating…</span>
        </>
      ) : (
        <>
          <FileDown className="w-4 h-4 text-blue-500" />
          <span>Download Report</span>
        </>
      )}
    </button>
  );
}

export function PDFExportError() {
  return (
    <div className="inline-flex items-center gap-1.5 text-xs text-red-600">
      <AlertCircle className="w-3.5 h-3.5" />
      Report unavailable
    </div>
  );
}
