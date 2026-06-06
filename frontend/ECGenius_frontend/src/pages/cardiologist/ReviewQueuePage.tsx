import { ClipboardList } from 'lucide-react';
import ComingSoonLayout from '../../components/common/ComingSoonLayout';

export default function ReviewQueuePage() {
  return (
    <ComingSoonLayout
      title="Review Queue"
      description="Incoming ECG cases referred by PHC Doctors awaiting your specialist review and override decision."
      icon={ClipboardList}
      iconBg="bg-amber-50"
      iconColor="text-amber-500"
      plannedFeatures={[
        'Sorted queue by urgency tier (Tier 1 critical first)',
        'Patient summary and referring doctor notes',
        'AI analysis pre-loaded for quick review',
        'Override decision with confidence annotation',
        'SLA countdown timer for each pending case',
      ]}
    />
  );
}
