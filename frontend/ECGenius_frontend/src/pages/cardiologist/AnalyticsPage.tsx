import { BarChart2 } from 'lucide-react';
import ComingSoonLayout from '../../components/common/ComingSoonLayout';

export default function AnalyticsPage() {
  return (
    <ComingSoonLayout
      title="Analytics"
      description="Platform-wide diagnosis analytics — review turnaround time, SLA compliance, accuracy trends, and workload distribution."
      icon={BarChart2}
      iconBg="bg-indigo-50"
      iconColor="text-indigo-500"
      plannedFeatures={[
        'Review turnaround time histogram',
        'SLA compliance rate by urgency tier',
        'Monthly and weekly case volume trends',
        'Diagnosis category breakdown over time',
        'Comparative accuracy: AI vs. specialist per condition',
      ]}
    />
  );
}
