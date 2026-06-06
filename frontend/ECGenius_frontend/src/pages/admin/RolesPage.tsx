import { Key } from 'lucide-react';
import ComingSoonLayout from '../../components/common/ComingSoonLayout';

export default function RolesPage() {
  return (
    <ComingSoonLayout
      title="Roles"
      description="Manage role assignments and configure feature-level permissions for all platform actors."
      icon={Key}
      iconBg="bg-indigo-50"
      iconColor="text-indigo-500"
      plannedFeatures={[
        'View all roles: PHC_DOCTOR, CARDIOLOGIST, PATIENT, ADMIN',
        'Assign or revoke roles for individual users',
        'Configure permission flags per role',
        'Role audit log — track assignment changes',
        'Temporary role elevation for specific cases',
      ]}
    />
  );
}
