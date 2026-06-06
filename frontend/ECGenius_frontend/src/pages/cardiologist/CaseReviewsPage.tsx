import { CheckCircle } from 'lucide-react';
import ComingSoonLayout from '../../components/common/ComingSoonLayout';

export default function CaseReviewsPage() {
  return (
    <ComingSoonLayout
      title="Case Reviews"
      description="History of completed specialist reviews, your override decisions, and outcome annotations for all reviewed ECG cases."
      icon={CheckCircle}
      iconBg="bg-emerald-50"
      iconColor="text-emerald-500"
      plannedFeatures={[
        'Filterable history by date, patient, and decision type',
        'Override decision summary with reasoning',
        'Outcome tracking — were overrides validated?',
        'Export completed review data as CSV',
        'Comparison view: AI diagnosis vs. specialist decision',
      ]}
    />
  );
}
