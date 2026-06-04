import React from 'react';
import { AlertCircle, ShieldAlert } from 'lucide-react';

interface EmergencyOverlayProps {
  condition: string;
  urgency: string;
  action: string;
  isTrueEmergency: boolean;
  onAcknowledge: () => void;
  onClose?: () => void;
}

export const EmergencyOverlay: React.FC<EmergencyOverlayProps> = ({
  condition,
  urgency,
  action,
  isTrueEmergency,
  onAcknowledge,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-red-950/90 backdrop-blur-md p-4">
      <div className="relative w-full max-w-2xl bg-black border-4 border-red-600 rounded-2xl shadow-[0_0_50px_15px_rgba(220,38,38,0.6)] p-8 text-center">
        
        <div className="flex justify-center mb-6">
          <div className="bg-red-600 text-white rounded-full p-4 animate-bounce">
            <ShieldAlert className="w-12 h-12" />
          </div>
        </div>

        <h1 className="text-4xl font-extrabold text-red-500 tracking-wider mb-2">
          CRITICAL ALERT
        </h1>
        <h2 className="text-2xl font-bold text-white mb-6 uppercase">
          Emergency ECG Detected
        </h2>

        <div className="bg-red-950/40 border border-red-800/60 rounded-xl p-6 text-left mb-8 space-y-4">
          <div>
            <span className="text-xs font-semibold text-red-400 uppercase tracking-wider">Condition</span>
            <p className="text-xl font-bold text-white">{condition}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-xs font-semibold text-red-400 uppercase tracking-wider">Urgency Tier</span>
              <p className="text-lg font-bold text-red-500">{urgency}</p>
            </div>
            <div>
              <span className="text-xs font-semibold text-red-400 uppercase tracking-wider">Status</span>
              <p className="text-lg font-bold text-amber-500">Critical Intervention Needed</p>
            </div>
          </div>
          <div className="border-t border-red-900/60 pt-4">
            <span className="text-xs font-semibold text-red-400 uppercase tracking-wider">Recommended Action</span>
            <p className="text-md font-semibold text-white mt-1 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <span>{action}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <button
            onClick={onAcknowledge}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-extrabold text-lg py-4 rounded-xl shadow-[0_0_20px_5px_rgba(220,38,38,0.4)] transition duration-300 transform hover:scale-[1.02] active:scale-[0.98] uppercase tracking-wider"
          >
            Acknowledge Critical Alert
          </button>
          
          {!isTrueEmergency && onClose && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition text-sm font-semibold underline underline-offset-4"
            >
              Temporarily Dismiss Alert
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmergencyOverlay;
