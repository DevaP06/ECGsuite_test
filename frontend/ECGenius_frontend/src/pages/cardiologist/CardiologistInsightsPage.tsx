import { Activity } from 'lucide-react';
import ComingSoonLayout from '../../components/common/ComingSoonLayout';

export default function CardiologistInsightsPage() {
  return (
    <ComingSoonLayout
      title="AI Insights"
      description="Aggregated AI model performance statistics and diagnosis trend analysis across all cases you have reviewed."
      icon={Activity}
      iconBg="bg-purple-50"
      iconColor="text-purple-500"
      plannedFeatures={[
        'AI accuracy rate vs. specialist override rate',
        'Confidence distribution across reviewed diagnoses',
        'Trending conditions and anomaly patterns',
        'Model version comparison over time',
        'False positive / false negative breakdown by category',
      ]}
    />
  );
}
