import { useParams } from "react-router-dom";
import DashboardLayout from "../components/layout/DashboardLayout";
import ECGWaveform from "../components/ecg/ECGWaveform";
import ECGFeaturesTable from "../components/ecg/ECGFeaturesTable";
import ECGDiagnosisPanel from "../components/ecg/ECGDiagnosisPanel";
import ECGExplainPanel from "../components/ecg/ECGExplainPanel";
import ECGTriageBadge from "../components/ecg/ECGTriageBadge";

export default function ECGDetail() {
  const { id, ecgId } = useParams();

  // 🔹 Mock triage with reasons
  const triageData = {
    ecg1: { status: "Normal", reason: "No significant abnormalities" },
    ecg2: { status: "Critical", reason: "Possible arrhythmia detected" },
    ecg3: { status: "Emergency", reason: "ST Elevation, immediate review required" },
  };

  const triage = triageData[ecgId as keyof typeof triageData] || {
    status: "Normal",
    reason: "Routine case",
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-2xl font-bold">ECG Analysis for Patient {id}</h2>
          <p className="text-gray-500">ECG Record ID: {ecgId}</p>

          {/* Complex Triage */}
          <div className="mt-3">
            <span className="font-medium">Triage Status: </span>
            <ECGTriageBadge
              status={triage.status as "Normal" | "Critical" | "Emergency"}
              reason={triage.reason}
            />
          </div>
        </div>

        {/* ECG Panels */}
        <ECGWaveform />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ECGFeaturesTable />
          <ECGDiagnosisPanel />
        </div>
        <ECGExplainPanel />
      </div>
    </DashboardLayout>
  );
}
