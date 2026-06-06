import { FlaskConical } from 'lucide-react';
import ComingSoonLayout from '../../components/common/ComingSoonLayout';

export default function ClinicalDashboardEntryPage() {
  return (
    <ComingSoonLayout
      title="Clinical Dashboard"
      description="The Clinical Dashboard fuses AI analysis results with patient clinical history to produce an evidence-based unified diagnosis. Access it by opening a specific diagnosis and submitting the clinical history questionnaire."
      icon={FlaskConical}
      iconBg="bg-emerald-50"
      iconColor="text-emerald-500"
      plannedFeatures={[
        'Evidence fusion of AI output + clinical questionnaire answers',
        'Differential diagnosis ranking with probability scores',
        'Risk stratification based on combined clinical context',
        'Clinical decision support output for referral guidance',
        'Integrated PDF report with full evidence trail',
      ]}
    />
  );
}
