import { AlertCircle, CheckCircle2, Siren } from "lucide-react"; // lucide-react icons


interface ECGTriageBadgeProps {
  status: "Normal" | "Critical" | "Emergency";
  reason?: string;  // optional technician note
}

export default function ECGTriageBadge({ status, reason }: ECGTriageBadgeProps) {
  let color = "";
  let Icon = CheckCircle2;

  switch (status) {
    case "Normal":
      color = "bg-green-100 text-green-800";
      Icon = CheckCircle2;
      break;
    case "Critical":
      color = "bg-yellow-100 text-yellow-800";
      Icon = AlertCircle;
      break;
    case "Emergency":
      color = "bg-red-100 text-red-800";
      Icon = Siren; // 🚨 siren-like icon
      break;
  }

  return (
    <div className="inline-flex items-center space-x-2">
      <span className={`flex items-center px-3 py-1 rounded text-sm font-semibold ${color}`}>
        <Icon className="w-4 h-4 mr-1" />
        {status}
      </span>
      {reason && (
        <span className="text-xs text-gray-500 italic">({reason})</span>
      )}
    </div>
  );
}
