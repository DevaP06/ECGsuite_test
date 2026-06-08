import { Loader2 } from 'lucide-react';
import ecgLogo from '../../assets/ECGenius_logo.png';

// Shown while AuthProvider is verifying a persisted session against the backend
// (status === 'initializing'). Replaces the old behavior where guards rendered
// nothing/redirected/threw mid-verification — which is what surfaced the root
// route's errorElement as an "Unexpected Error" page on first load.
export default function AuthLoadingScreen() {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4 px-4">
      <img src={ecgLogo} alt="ECGenius" className="w-14 h-14" />
      <div className="flex items-center gap-2 text-blue-300">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-sm font-medium">Setting up your workspace…</span>
      </div>
    </div>
  );
}
