import { ScrollText } from 'lucide-react';
import ComingSoonLayout from '../../components/common/ComingSoonLayout';

export default function AuditLogsPage() {
  return (
    <ComingSoonLayout
      title="Audit Logs"
      description="Complete audit trail of all user actions, diagnoses generated, data access events, and administrative operations across the platform."
      icon={ScrollText}
      iconBg="bg-slate-100"
      iconColor="text-slate-500"
      plannedFeatures={[
        'Filterable log stream by user, action type, and date range',
        'ECG upload and analysis creation events',
        'Cardiologist review and override events',
        'Admin actions: user creation, suspension, role changes',
        'Export logs as CSV for compliance reporting',
      ]}
    />
  );
}
