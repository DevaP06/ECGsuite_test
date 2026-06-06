import { useState } from 'react';
import { ZoomIn, ZoomOut, Maximize2, AlertCircle, Loader2, FlameKindling } from 'lucide-react';

interface ECGHeatmapProps {
  heatmapUrl?: string | null;
}

export default function ECGHeatmap({ heatmapUrl }: ECGHeatmapProps) {
  const [scale, setScale] = useState(1);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [lightbox, setLightbox] = useState(false);

  const zoomIn  = () => setScale((s) => Math.min(s + 0.25, 3));
  const zoomOut = () => setScale((s) => Math.max(s - 0.25, 0.5));

  if (!heatmapUrl) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <FlameKindling className="w-4 h-4 text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-700">SHAP Explainability Heatmap</h3>
        </div>
        <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-6 py-10 text-center">
          <p className="text-sm text-slate-500">Heatmap not available for this analysis.</p>
          <p className="text-xs text-slate-400 mt-1">The backend did not return a heatmap URL.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FlameKindling className="w-4 h-4 text-orange-500" />
            <h3 className="text-sm font-semibold text-slate-800">SHAP Explainability Heatmap</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={zoomOut}
              disabled={scale <= 0.5}
              className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-40 transition"
              aria-label="Zoom out"
            >
              <ZoomOut className="w-4 h-4 text-slate-500" />
            </button>
            <span className="text-xs text-slate-500 w-10 text-center">{Math.round(scale * 100)}%</span>
            <button
              onClick={zoomIn}
              disabled={scale >= 3}
              className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-40 transition"
              aria-label="Zoom in"
            >
              <ZoomIn className="w-4 h-4 text-slate-500" />
            </button>
            <button
              onClick={() => setLightbox(true)}
              className="p-1.5 rounded hover:bg-gray-100 transition"
              aria-label="Fullscreen"
            >
              <Maximize2 className="w-4 h-4 text-slate-500" />
            </button>
          </div>
        </div>

        <div className="overflow-auto rounded-lg bg-gray-950 border border-gray-800 max-h-96 flex items-center justify-center relative">
          {!loaded && !error && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
            </div>
          )}
          {error ? (
            <div className="flex flex-col items-center gap-2 p-8 text-center">
              <AlertCircle className="w-8 h-8 text-red-400" />
              <p className="text-sm text-gray-400">Failed to load heatmap image.</p>
            </div>
          ) : (
            <img
              src={heatmapUrl}
              alt="SHAP explainability heatmap"
              style={{ transform: `scale(${scale})`, transformOrigin: 'center', transition: 'transform 0.2s' }}
              className={`max-w-full transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
              onLoad={() => setLoaded(true)}
              onError={() => { setError(true); setLoaded(true); }}
            />
          )}
        </div>

        <p className="text-xs text-slate-400 mt-3 text-center">
          Regions highlighted in warm colours indicate the highest model attribution.
        </p>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightbox(false)}
        >
          <img
            src={heatmapUrl}
            alt="SHAP heatmap fullscreen"
            className="max-w-full max-h-full rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setLightbox(false)}
            className="absolute top-4 right-4 text-white/70 hover:text-white text-2xl leading-none"
          >
            ✕
          </button>
        </div>
      )}
    </>
  );
}
