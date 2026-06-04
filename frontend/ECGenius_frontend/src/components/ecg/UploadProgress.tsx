import React from 'react';
import { CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';

interface UploadProgressProps {
  progress: number;
  status: 'idle' | 'uploading' | 'success' | 'error';
}

export const UploadProgress: React.FC<UploadProgressProps> = ({ progress, status }) => {
  if (status === 'idle') return null;

  const isSuccess = status === 'success';
  const isError = status === 'error';
  const isUploading = status === 'uploading';

  let progressColor = 'bg-blue-600';
  let textColor = 'text-blue-600';
  if (isSuccess) {
    progressColor = 'bg-green-600';
    textColor = 'text-green-600';
  } else if (isError) {
    progressColor = 'bg-red-600';
    textColor = 'text-red-600';
  }

  return (
    <div className="w-full bg-slate-50 border border-slate-200 rounded-lg p-4 shadow-sm transition-all duration-300">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold flex items-center gap-2">
          {isUploading && (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              <span className="text-slate-700">Uploading ECG file...</span>
            </>
          )}
          {isSuccess && (
            <>
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span className="text-green-700">Analysis completed!</span>
            </>
          )}
          {isError && (
            <>
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span className="text-red-700">Upload failed</span>
            </>
          )}
        </span>
        <span className={`text-sm font-bold ${textColor}`}>{progress}%</span>
      </div>

      <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ease-out ${progressColor}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

export default UploadProgress;
