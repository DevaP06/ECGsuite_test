import { useRef, useState } from 'react';
import { Camera, Loader2, AlertTriangle, X } from 'lucide-react';

interface Props {
  imageUrl?: string | null;
  initials: string;
  onSelect: (dataUrl: string | null) => void;
  size?: 'md' | 'lg';
}

const MAX_SIZE_BYTES = 2 * 1024 * 1024;

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Could not read the selected file.'));
    reader.readAsDataURL(file);
  });
}

// Avatar selection is intentionally split into two steps — selecting/previewing
// the raw image here, then handing the resulting data URL up via onSelect — so
// a future crop step can be inserted between "selected" and "committed" without
// reshaping this component's contract.
export default function AvatarUploader({ imageUrl, initials, onSelect, size = 'lg' }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(imageUrl ?? null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dimension = size === 'lg' ? 'w-24 h-24' : 'w-16 h-16';
  const textSize = size === 'lg' ? 'text-2xl' : 'text-base';

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setError(null);

    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file (PNG, JPG, or WEBP).');
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setError('Image is too large — please choose a file under 2MB.');
      return;
    }

    setBusy(true);
    try {
      const dataUrl = await readAsDataUrl(file);
      setPreview(dataUrl);
      onSelect(dataUrl);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not load the selected image.');
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    setError(null);
    onSelect(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="flex items-center gap-4">
      <div className={`relative ${dimension} shrink-0 group`}>
        {preview ? (
          <img src={preview} alt="Profile avatar preview" className={`${dimension} rounded-full object-cover border border-gray-200`} />
        ) : (
          <div className={`${dimension} rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white font-bold ${textSize}`}>
            {initials}
          </div>
        )}

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          title="Change avatar"
          className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/40 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition disabled:cursor-wait"
        >
          {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
        </button>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-slate-600 hover:bg-gray-50 transition disabled:opacity-60"
          >
            <Camera className="w-3.5 h-3.5" />
            {preview ? 'Change photo' : 'Upload photo'}
          </button>
          {preview && (
            <button
              type="button"
              onClick={handleRemove}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-slate-500 hover:bg-gray-50 hover:text-red-600 transition"
            >
              <X className="w-3.5 h-3.5" />
              Remove
            </button>
          )}
        </div>
        <p className="text-xs text-slate-400">PNG, JPG, or WEBP — up to 2MB.</p>
        {error && (
          <p className="flex items-center gap-1.5 text-xs text-red-600">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            {error}
          </p>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </div>
  );
}
