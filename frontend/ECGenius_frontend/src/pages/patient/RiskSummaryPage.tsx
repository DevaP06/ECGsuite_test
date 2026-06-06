import { AlertTriangle } from 'lucide-react';
import ComingSoonLayout from '../../components/common/ComingSoonLayout';

export default function RiskSummaryPage() {
  return (
    <ComingSoonLayout
      title="Risk Summary"
      description="A rolling summary of your heart health indicators, risk category, and trend analysis based on your accumulated ECG analyses over time."
      icon={AlertTriangle}
      iconBg="bg-amber-50"
      iconColor="text-amber-500"
      plannedFeatures={[
        'Overall heart health risk score (Low / Moderate / High)',
        'Trend chart of key metrics over the last 6–12 months',
        'Recurring anomaly patterns across uploads',
        'Risk factor summary from clinical questionnaire history',
        'Recommended follow-up actions from AI analysis',
      ]}
    />
  );
}
