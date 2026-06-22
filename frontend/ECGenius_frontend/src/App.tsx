import {
  createBrowserRouter,
  createRoutesFromElements,
  RouterProvider,
  Route,
  Navigate,
} from 'react-router-dom';
import { lazy, Suspense } from 'react';

import { AuthProvider } from './features/auth/useAuth';
import { getPostAuthRoute } from './features/auth/roleUtils';
import AuthGuard from './components/common/AuthGuard';
import RoleGuard from './components/common/RoleGuard';
import OnboardingGuard from './components/common/OnboardingGuard';
import ErrorBoundary from './components/common/ErrorBoundary';
import { Toaster } from 'react-hot-toast';

// ── Eagerly loaded: shell + public pages (always needed on first paint) ──────
import MainLayout from './pages/MainLayout';
import ErrorPage from './pages/ErrorPage';
import HomePage from './pages/HomePage';
import NotFound from './pages/NotFound';

// ── Lazy: public informational pages ─────────────────────────────────────────
const About = lazy(() => import('./pages/About'));
const HowItWorksPage = lazy(() => import('./pages/HowItWorksPage'));
const PricingPage = lazy(() => import('./pages/PricingPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const TryBetaPage = lazy(() => import('./pages/TryBetaPage'));
const Careers = lazy(() => import('./pages/Careers'));

// ── Lazy: auth pages ──────────────────────────────────────────────────────────
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));

// ── Lazy: onboarding ─────────────────────────────────────────────────────────
const RoleSelectionPage = lazy(() => import('./pages/onboarding/RoleSelectionPage'));
const ProfileCompletionPage = lazy(() => import('./pages/onboarding/ProfileCompletionPage'));

// ── Lazy: doctor ─────────────────────────────────────────────────────────────
const DoctorDashboard = lazy(() => import('./pages/doctor/DoctorDashboard'));
const DoctorInsightsPage = lazy(() => import('./pages/doctor/DoctorInsightsPage'));
const ReviewRequestPage = lazy(() => import('./pages/doctor/ReviewRequestPage'));
const ClinicalDashboardEntryPage = lazy(() => import('./pages/doctor/ClinicalDashboardEntryPage'));

// ── Lazy: cardiologist ───────────────────────────────────────────────────────
const CardiologistDashboard = lazy(() => import('./pages/cardiologist/CardiologistDashboard'));
const ReviewQueuePage = lazy(() => import('./pages/cardiologist/ReviewQueuePage'));
const CaseReviewsPage = lazy(() => import('./pages/cardiologist/CaseReviewsPage'));
const CaseReviewPage = lazy(() => import('./pages/cardiologist/CaseReviewPage'));
const CardiologistInsightsPage = lazy(() => import('./pages/cardiologist/CardiologistInsightsPage'));
const AnalyticsDashboardPage = lazy(() => import('./pages/cardiologist/AnalyticsDashboardPage'));
const AnnotationWorkspacePage = lazy(() => import('./pages/cardiologist/AnnotationWorkspacePage'));
const ValidationDashboardPage = lazy(() => import('./pages/cardiologist/ValidationDashboardPage'));

// ── Lazy: patient ─────────────────────────────────────────────────────────────
const PatientDashboard = lazy(() => import('./pages/patient/PatientDashboard'));
const MyReportsPage = lazy(() => import('./pages/patient/MyReportsPage'));
const HistoryPage = lazy(() => import('./pages/patient/HistoryPage'));
const RiskSummaryPage = lazy(() => import('./pages/patient/RiskSummaryPage'));

// ── Lazy: admin ───────────────────────────────────────────────────────────────
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const UsersPage = lazy(() => import('./pages/admin/UsersPage'));
const RolesPage = lazy(() => import('./pages/admin/RolesPage'));
const AuditLogsPage = lazy(() => import('./pages/admin/AuditLogsPage'));
const SystemHealthPage = lazy(() => import('./pages/admin/SystemHealthPage'));
const ModelsPage = lazy(() => import('./pages/admin/ModelsPage'));

// ── Lazy: shared clinical ─────────────────────────────────────────────────────
const ECGUpload = lazy(() => import('./pages/ECGUpload'));
const ECGDetail = lazy(() => import('./pages/ECGDetails'));
const DiagnosisDetail = lazy(() => import('./pages/DiagnosisDetail'));
const ClinicalQuestionnairePage = lazy(() => import('./pages/ClinicalQuestionnairePage'));
const ClinicalDashboard = lazy(() => import('./pages/clinical/ClinicalDashboard'));
const FailedAnalysisPage = lazy(() => import('./pages/analysis/FailedAnalysisPage'));
const AuditTrailPage = lazy(() => import('./pages/AuditTrailPage'));

// ── Lazy: patient management ──────────────────────────────────────────────────
const PatientListPage = lazy(() => import('./pages/patients/PatientListPage'));
const PatientDetailPage = lazy(() => import('./pages/patients/PatientDetailPage'));
const PatientRegistrationPage = lazy(() => import('./pages/patients/PatientRegistrationPage'));

// ── Lazy: profile & settings ──────────────────────────────────────────────────
const ProfilePage = lazy(() => import('./pages/profile/ProfilePage'));
const SettingsPage = lazy(() => import('./pages/settings/SettingsPage'));

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function DashboardRedirect() {
  return <Navigate to={getPostAuthRoute()} replace />;
}

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<MainLayout />} errorElement={<ErrorPage />}>
      {/* ── Public routes ─────────────────────────────────────────────── */}
      <Route index element={<HomePage />} />
      <Route path="about" element={<About />} />
      <Route path="how-it-works" element={<HowItWorksPage />} />
      <Route path="pricing" element={<PricingPage />} />
      <Route path="contact" element={<ContactPage />} />
      <Route path="try-beta" element={<TryBetaPage />} />
      <Route path="login" element={<LoginPage />} />
      <Route path="register" element={<RegisterPage />} />
      <Route path="Sign-Up-Page" element={<Navigate to="/login" replace />} />
      <Route path="careers" element={<Careers />} />
      <Route path="*" element={<NotFound />} />

      {/* ── Onboarding ───────────────────────────────────────────────── */}
      <Route
        path="onboarding/role"
        element={<OnboardingGuard step="role"><RoleSelectionPage /></OnboardingGuard>}
      />
      <Route
        path="onboarding/profile"
        element={<OnboardingGuard step="profile"><ProfileCompletionPage /></OnboardingGuard>}
      />

      <Route path="dashboard" element={<AuthGuard><DashboardRedirect /></AuthGuard>} />

      {/* ── Doctor ───────────────────────────────────────────────────── */}
      <Route path="doctor/dashboard" element={<RoleGuard allowedRoles={['PHC_DOCTOR']}><DoctorDashboard /></RoleGuard>} />
      <Route path="doctor/insights" element={<RoleGuard allowedRoles={['PHC_DOCTOR']}><DoctorInsightsPage /></RoleGuard>} />
      <Route path="doctor/clinical" element={<RoleGuard allowedRoles={['PHC_DOCTOR']}><ClinicalDashboardEntryPage /></RoleGuard>} />
      <Route path="doctor/review-request" element={<RoleGuard allowedRoles={['PHC_DOCTOR']}><ReviewRequestPage /></RoleGuard>} />

      {/* ── Cardiologist ─────────────────────────────────────────────── */}
      <Route path="cardiologist/dashboard" element={<RoleGuard allowedRoles={['CARDIOLOGIST']}><CardiologistDashboard /></RoleGuard>} />
      <Route path="cardiologist/queue" element={<RoleGuard allowedRoles={['CARDIOLOGIST']}><ReviewQueuePage /></RoleGuard>} />
      <Route path="cardiologist/reviews" element={<RoleGuard allowedRoles={['CARDIOLOGIST']}><CaseReviewsPage /></RoleGuard>} />
      <Route path="cardiologist/review/:reviewId" element={<RoleGuard allowedRoles={['CARDIOLOGIST']}><CaseReviewPage /></RoleGuard>} />
      <Route path="cardiologist/insights" element={<RoleGuard allowedRoles={['CARDIOLOGIST']}><CardiologistInsightsPage /></RoleGuard>} />
      <Route path="cardiologist/analytics" element={<RoleGuard allowedRoles={['CARDIOLOGIST']}><AnalyticsDashboardPage /></RoleGuard>} />
      <Route path="cardiologist/validation" element={<RoleGuard allowedRoles={['CARDIOLOGIST']}><ValidationDashboardPage /></RoleGuard>} />
      <Route path="cardiologist/annotation/:analysisId" element={<RoleGuard allowedRoles={['CARDIOLOGIST']}><AnnotationWorkspacePage /></RoleGuard>} />

      {/* ── Patient ──────────────────────────────────────────────────── */}
      <Route path="patient/dashboard" element={<RoleGuard allowedRoles={['PATIENT']}><PatientDashboard /></RoleGuard>} />
      <Route path="patient/reports" element={<RoleGuard allowedRoles={['PATIENT']}><MyReportsPage /></RoleGuard>} />
      <Route path="patient/history" element={<RoleGuard allowedRoles={['PATIENT']}><HistoryPage /></RoleGuard>} />
      <Route path="patient/risk" element={<RoleGuard allowedRoles={['PATIENT']}><RiskSummaryPage /></RoleGuard>} />

      {/* ── Admin ────────────────────────────────────────────────────── */}
      <Route path="admin/dashboard" element={<RoleGuard allowedRoles={['ADMIN']}><AdminDashboard /></RoleGuard>} />
      <Route path="admin/users" element={<RoleGuard allowedRoles={['ADMIN']}><UsersPage /></RoleGuard>} />
      <Route path="admin/roles" element={<RoleGuard allowedRoles={['ADMIN']}><RolesPage /></RoleGuard>} />
      <Route path="admin/audit" element={<RoleGuard allowedRoles={['ADMIN']}><AuditLogsPage /></RoleGuard>} />
      <Route path="admin/system" element={<RoleGuard allowedRoles={['ADMIN']}><SystemHealthPage /></RoleGuard>} />
      <Route path="admin/models" element={<RoleGuard allowedRoles={['ADMIN']}><ModelsPage /></RoleGuard>} />

      {/* ── Shared clinical (multi-role) ──────────────────────────────── */}
      <Route
        path="ecgupload"
        element={<RoleGuard allowedRoles={['PHC_DOCTOR', 'PATIENT']}><ECGUpload /></RoleGuard>}
      />
      <Route
        path="clinical-context/:analysisId"
        element={<RoleGuard allowedRoles={['PHC_DOCTOR', 'CARDIOLOGIST']}><ClinicalQuestionnairePage /></RoleGuard>}
      />
      <Route path="clinical-dashboard/:analysisId" element={<AuthGuard><ClinicalDashboard /></AuthGuard>} />
      <Route path="analysis-failed/:analysisId" element={<AuthGuard><FailedAnalysisPage /></AuthGuard>} />
      <Route
        path="audit/:analysisId"
        element={<RoleGuard allowedRoles={['PHC_DOCTOR', 'CARDIOLOGIST', 'ADMIN']}><AuditTrailPage /></RoleGuard>}
      />

      {/* ── Patient management ───────────────────────────────────────── */}
      <Route path="patients/register" element={<RoleGuard allowedRoles={['PHC_DOCTOR']}><PatientRegistrationPage /></RoleGuard>} />
      <Route path="patients" element={<RoleGuard allowedRoles={['PHC_DOCTOR', 'CARDIOLOGIST']}><PatientListPage /></RoleGuard>} />
      <Route path="patients/:patientId" element={<RoleGuard allowedRoles={['PHC_DOCTOR', 'CARDIOLOGIST']}><PatientDetailPage /></RoleGuard>} />
      <Route path="patients/:id/ecg/:ecgId" element={<RoleGuard allowedRoles={['PHC_DOCTOR']}><ECGDetail /></RoleGuard>} />

      {/* ── Profile & Settings ───────────────────────────────────────── */}
      <Route path="profile" element={<AuthGuard><ProfilePage /></AuthGuard>} />
      <Route path="settings" element={<AuthGuard><SettingsPage /></AuthGuard>} />

      {/* ── Diagnosis detail ─────────────────────────────────────────── */}
      <Route path="diagnosisdetail/:id/ecg/:ecgId" element={<AuthGuard><DiagnosisDetail /></AuthGuard>} />
      <Route path="diagnosisdetail/:id" element={<AuthGuard><DiagnosisDetail /></AuthGuard>} />
      <Route path="diagnosisdetail" element={<AuthGuard><DiagnosisDetail /></AuthGuard>} />
    </Route>
  )
);

const App = () => {
  return (
    <ErrorBoundary>
      <div className="min-h-screen">
        <AuthProvider>
          <Toaster position="top-right" />
          <Suspense fallback={<PageLoader />}>
            <RouterProvider router={router} />
          </Suspense>
        </AuthProvider>
      </div>
    </ErrorBoundary>
  );
};

export default App;
