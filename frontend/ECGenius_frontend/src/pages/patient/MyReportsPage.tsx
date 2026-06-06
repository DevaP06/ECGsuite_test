import { FileText } from 'lucide-react';
import ComingSoonLayout from '../../components/common/ComingSoonLayout';

export default function MyReportsPage() {
  return (
    <ComingSoonLayout
      title="My Reports"
      description="View AI analysis results for all your previously uploaded ECGs, including diagnosis summaries and cardiologist review outcomes."
      icon={FileText}
      iconBg="bg-blue-50"
      iconColor="text-blue-500"
      plannedFeatures={[
        'Chronological list of all your ECG analysis reports',
        'Summary card: diagnosis, confidence tier, and status',
        'Download individual report as PDF',
        'Filter by date range and diagnosis category',
        'Cardiologist review indicator per report',
      ]}
    />
  );
}
