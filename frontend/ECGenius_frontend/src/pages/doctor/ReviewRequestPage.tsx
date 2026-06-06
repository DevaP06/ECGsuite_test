import { ClipboardList } from 'lucide-react';
import ComingSoonLayout from '../../components/common/ComingSoonLayout';

export default function ReviewRequestPage() {
  return (
    <ComingSoonLayout
      title="Request Review"
      description="Submit ECG cases to a cardiologist for specialist review. Track request status and receive override decisions directly in your workflow."
      icon={ClipboardList}
      iconBg="bg-amber-50"
      iconColor="text-amber-500"
      plannedFeatures={[
        'Select an analysis and attach clinical notes for review',
        'Route to available cardiologist or specific specialist',
        'Real-time status tracking (Pending → In Review → Completed)',
        'Receive override decision with cardiologist annotations',
        'SLA countdown for Tier 1 critical cases (4-hour response)',
      ]}
    />
  );
}
