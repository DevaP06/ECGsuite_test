import { useParams } from "react-router-dom";
import DashboardLayout from "../components/layout/DashboardLayout";
import DiagnosisOverview from "../components/diagnosis/DiagnosisOverview";
import ExplainabilityChart from "../components/diagnosis/ExplainabilityChart";
import RecommendationsPanel from "../components/diagnosis/RecommendationsPanel";

export default function DiagnosisDetail() {
  const { id, ecgId } = useParams();

  // Later replace this with API call: getDiagnosis(patientId, ecgId)
  const mockReport = {
    patientId: id,
    ecgId,
    date: "2025-10-19",
    status: "Reviewed",
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white shadow rounded-lg p-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">AI Diagnosis Report</h2>
            <p className="text-gray-500">
              Patient ID: {mockReport.patientId} • ECG ID: {mockReport.ecgId}
            </p>
          </div>
          <span className="px-3 py-1 text-sm rounded bg-blue-100 text-blue-800">
            Generated on: {mockReport.date}
          </span>
        </div>

        {/* AI Insights */}
        <DiagnosisOverview />

        {/* Explainability */}
        <ExplainabilityChart />

        {/* Post-Diagnostic Intelligence */}
        <RecommendationsPanel />
      </div>
    </DashboardLayout>
  );
}
