import { History } from 'lucide-react';
import ComingSoonLayout from '../../components/common/ComingSoonLayout';

export default function HistoryPage() {
  return (
    <ComingSoonLayout
      title="History"
      description="A complete timeline of your ECG uploads, AI diagnoses, clinical questionnaire submissions, and cardiologist review outcomes."
      icon={History}
      iconBg="bg-slate-100"
      iconColor="text-slate-500"
      plannedFeatures={[
        'Full chronological activity timeline',
        'ECG upload events with status indicators',
        'Clinical questionnaire submission records',
        'Cardiologist review events and outcomes',
        'Exportable history summary',
      ]}
    />
  );
}
