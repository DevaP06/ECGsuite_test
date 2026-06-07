import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const SEGMENT_LABELS: Record<string, string> = {
  // Role prefixes
  doctor: 'Doctor',
  cardiologist: 'Cardiologist',
  patient: 'Patient',
  admin: 'Admin',

  // Common
  dashboard: 'Dashboard',
  ecgupload: 'Upload ECG',
  patients: 'Patients',
  diagnosisdetail: 'Diagnosis',

  // Doctor routes
  insights: 'AI Insights',
  clinical: 'Clinical Dashboard',
  'review-request': 'Request Review',

  // Cardiologist routes
  queue: 'Review Queue',
  reviews: 'Case Reviews',
  analytics: 'Analytics',
  ontology: 'Ontology Rules',

  // Patient routes
  reports: 'My Reports',
  history: 'History',
  risk: 'Risk Summary',

  // Admin routes
  users: 'Users',
  roles: 'Roles',
  audit: 'Audit Logs',
  system: 'System Health',
  models: 'Models',

  // Questionnaire workflow
  questionnaire: 'Clinical History',
  'clinical-dashboard': 'Clinical Dashboard',

  // Onboarding
  onboarding: 'Onboarding',
  role: 'Select Role',
  profile: 'Complete Profile',
};

export default function Breadcrumb() {
  const { pathname } = useLocation();
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length === 0) return null;

  const crumbs = segments.map((seg, i) => {
    const path = '/' + segments.slice(0, i + 1).join('/');
    const isLast = i === segments.length - 1;
    const label = SEGMENT_LABELS[seg] ?? seg;
    return { label, path, isLast };
  });

  return (
    <nav className="flex items-center gap-1 text-sm text-slate-500" aria-label="Breadcrumb">
      <Link to="/" className="hover:text-blue-600 transition">
        <Home className="w-3.5 h-3.5" />
      </Link>
      {crumbs.map((crumb) => (
        <span key={crumb.path} className="flex items-center gap-1">
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          {crumb.isLast ? (
            <span className="font-medium text-slate-700">{crumb.label}</span>
          ) : (
            <Link to={crumb.path} className="hover:text-blue-600 transition">
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
