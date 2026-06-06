import { Activity } from 'lucide-react';
import ComingSoonLayout from '../../components/common/ComingSoonLayout';

export default function DoctorInsightsPage() {
  return (
    <ComingSoonLayout
      title="AI Insights"
      description="Aggregated AI analysis trends from your patients' ECG uploads — condition frequency, confidence distribution, and anomaly patterns over time."
      icon={Activity}
      iconBg="bg-purple-50"
      iconColor="text-purple-500"
      plannedFeatures={[
        'Condition frequency breakdown by diagnosis category',
        'Confidence tier distribution across recent analyses',
        'Anomaly trend charts over the last 30 / 90 days',
        'Most commonly detected rhythm patterns',
        'Alert rate and Tier 1 emergency frequency',
      ]}
    />
  );
}
