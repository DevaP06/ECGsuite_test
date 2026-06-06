export type UserRole = 'PHC_DOCTOR' | 'CARDIOLOGIST' | 'PATIENT' | 'ADMIN';

export const ROLE_DISPLAY_NAMES: Record<UserRole, string> = {
  PHC_DOCTOR: 'PHC Doctor',
  CARDIOLOGIST: 'Cardiologist',
  PATIENT: 'Patient',
  ADMIN: 'Platform Admin',
};

export const ROLE_DASHBOARD_ROUTES: Record<UserRole, string> = {
  PHC_DOCTOR: '/doctor/dashboard',
  CARDIOLOGIST: '/cardiologist/dashboard',
  PATIENT: '/patient/dashboard',
  ADMIN: '/admin/dashboard',
};

export interface NavItem {
  label: string;
  path: string;
  icon: string;
  isPlaceholder?: boolean;
}

export const ROLE_NAV_ITEMS: Record<UserRole, NavItem[]> = {
  PHC_DOCTOR: [
    { label: 'Dashboard',          path: '/doctor/dashboard',       icon: 'Home'          },
    { label: 'Patients',           path: '/patients',               icon: 'Users'         },
    { label: 'Upload ECG',         path: '/ecgupload',              icon: 'Upload'        },
    { label: 'AI Insights',        path: '/doctor/insights',        icon: 'Activity',     isPlaceholder: true },
    { label: 'Clinical Dashboard', path: '/doctor/clinical',        icon: 'FlaskConical', isPlaceholder: true },
    { label: 'Request Review',     path: '/doctor/review-request',  icon: 'ClipboardList',isPlaceholder: true },
  ],
  CARDIOLOGIST: [
    { label: 'Dashboard',          path: '/cardiologist/dashboard', icon: 'Home'          },
    { label: 'Review Queue',       path: '/cardiologist/queue',     icon: 'ClipboardList',isPlaceholder: true },
    { label: 'Case Reviews',       path: '/cardiologist/reviews',   icon: 'CheckCircle',  isPlaceholder: true },
    { label: 'AI Insights',        path: '/cardiologist/insights',  icon: 'Activity',     isPlaceholder: true },
    { label: 'Analytics',          path: '/cardiologist/analytics', icon: 'BarChart2',    isPlaceholder: true },
    { label: 'Ontology Rules',     path: '/cardiologist/ontology',  icon: 'BookOpen',     isPlaceholder: true },
  ],
  PATIENT: [
    { label: 'Dashboard',          path: '/patient/dashboard',      icon: 'Home'          },
    { label: 'Upload ECG',         path: '/ecgupload',              icon: 'Upload'        },
    { label: 'My Reports',         path: '/patient/reports',        icon: 'FileText',     isPlaceholder: true },
    { label: 'History',            path: '/patient/history',        icon: 'Clock',        isPlaceholder: true },
    { label: 'Risk Summary',       path: '/patient/risk',           icon: 'AlertTriangle',isPlaceholder: true },
  ],
  ADMIN: [
    { label: 'Dashboard',          path: '/admin/dashboard',        icon: 'Home'          },
    { label: 'Users',              path: '/admin/users',            icon: 'Users',        isPlaceholder: true },
    { label: 'Roles',              path: '/admin/roles',            icon: 'ShieldCheck',  isPlaceholder: true },
    { label: 'Audit Logs',         path: '/admin/audit',            icon: 'ScrollText',   isPlaceholder: true },
    { label: 'System Health',      path: '/admin/system',           icon: 'Server',       isPlaceholder: true },
    { label: 'Models',             path: '/admin/models',           icon: 'Cpu',          isPlaceholder: true },
  ],
};
