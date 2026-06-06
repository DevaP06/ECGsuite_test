import { Users } from 'lucide-react';
import ComingSoonLayout from '../../components/common/ComingSoonLayout';

export default function UsersPage() {
  return (
    <ComingSoonLayout
      title="Users"
      description="Create, suspend, and manage user accounts across all platform roles — PHC Doctor, Cardiologist, Patient, and Admin."
      icon={Users}
      iconBg="bg-blue-50"
      iconColor="text-blue-500"
      plannedFeatures={[
        'User listing with role, status, and last-active filters',
        'Create new user with role assignment',
        'Suspend or reactivate accounts',
        'Password reset and credential management',
        'Bulk import users via CSV',
      ]}
    />
  );
}
