import {
  createBrowserRouter,
  createRoutesFromElements,
  RouterProvider,
  Route,
  Navigate,
} from 'react-router-dom';

import MainLayout from './pages/MainLayout';
import ErrorPage from './pages/ErrorPage';
import HomePage from './pages/HomePage';
import About from './pages/About';
import NotFound from './pages/NotFound';
import HowItWorksPage from './pages/HowItWorksPage';
import PricingPage from './pages/PricingPage';
import ContactPage from './pages/ContactPage';
import TryBetaPage from './pages/TryBetaPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Careers from './pages/Careers';
import ECGDetail from './pages/ECGDetails';
import PatientListPage from './pages/patients/PatientListPage';
import PatientDetailPage from './pages/patients/PatientDetailPage';
import PatientRegistrationPage from './pages/patients/PatientRegistrationPage';
import ECGUpload from './pages/ECGUpload';
import DiagnosisDetail from './pages/DiagnosisDetail';
import RoleSelectPage from './pages/RoleSelectPage';
import HistoryQuestionnairePage from './pages/questionnaire/HistoryQuestionnairePage';
import ClinicalDashboard from './pages/clinical/ClinicalDashboard';
import FailedAnalysisPage from './pages/analysis/FailedAnalysisPage';

// Role dashboards
import DoctorDashboard from './pages/doctor/DoctorDashboard';
import CardiologistDashboard from './pages/cardiologist/CardiologistDashboard';
import PatientDashboard from './pages/patient/PatientDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';

// Doctor placeholder pages
import DoctorInsightsPage from './pages/doctor/DoctorInsightsPage';
import ReviewRequestPage from './pages/doctor/ReviewRequestPage';
import ClinicalDashboardEntryPage from './pages/doctor/ClinicalDashboardEntryPage';

// Cardiologist pages
import ReviewQueuePage from './pages/cardiologist/ReviewQueuePage';
import CaseReviewsPage from './pages/cardiologist/CaseReviewsPage';
import CaseReviewPage from './pages/cardiologist/CaseReviewPage';
import CardiologistInsightsPage from './pages/cardiologist/CardiologistInsightsPage';
import AnalyticsDashboardPage from './pages/cardiologist/AnalyticsDashboardPage';
import OntologyRulesPage from './pages/cardiologist/OntologyRulesPage';
import AnnotationWorkspacePage from './pages/cardiologist/AnnotationWorkspacePage';
import ValidationDashboardPage from './pages/cardiologist/ValidationDashboardPage';

// Patient placeholder pages
import MyReportsPage from './pages/patient/MyReportsPage';
import HistoryPage from './pages/patient/HistoryPage';
import RiskSummaryPage from './pages/patient/RiskSummaryPage';

// Admin placeholder pages
import UsersPage from './pages/admin/UsersPage';
import RolesPage from './pages/admin/RolesPage';
import AuditLogsPage from './pages/admin/AuditLogsPage';
import SystemHealthPage from './pages/admin/SystemHealthPage';
import ModelsPage from './pages/admin/ModelsPage';

import { AuthProvider } from './features/auth/useAuth';
import { getDashboardRoute } from './features/auth/roleUtils';
import AuthGuard from './components/common/AuthGuard';
import RoleGuard from './components/common/RoleGuard';
import { Toaster } from 'react-hot-toast';

function DashboardRedirect() {
  return <Navigate to={getDashboardRoute()} replace />;
}

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<MainLayout />} errorElement={<ErrorPage />}>
      {/* ── Public routes ─────────────────────────────────────────────── */}
      <Route index element={<HomePage />} />
      <Route path="about" element={<About />} />
      <Route path="how-it-works" element={<HowItWorksPage />} />
      <Route path="pricing" element={<PricingPage />} />
      <Route path="Contact" element={<ContactPage />} />
      <Route path="try-beta" element={<TryBetaPage />} />
      {/* Dedicated auth routes */}
      <Route path="login" element={<LoginPage />} />
      <Route path="register" element={<RegisterPage />} />
      {/* Legacy alias — redirect /Sign-Up-Page to /login */}
      <Route path="Sign-Up-Page" element={<Navigate to="/login" replace />} />
      <Route path="careers" element={<Careers />} />
      <Route path="*" element={<NotFound />} />

      {/* ── Auth ──────────────────────────────────────────────────────── */}
      <Route path="select-role" element={<AuthGuard><RoleSelectPage /></AuthGuard>} />

      {/* Legacy /dashboard → redirect to role dashboard */}
      <Route path="dashboard" element={<AuthGuard><DashboardRedirect /></AuthGuard>} />

      {/* ── Doctor routes ─────────────────────────────────────────────── */}
      <Route
        path="doctor/dashboard"
        element={<RoleGuard allowedRoles={['PHC_DOCTOR']}><DoctorDashboard /></RoleGuard>}
      />
      <Route
        path="doctor/insights"
        element={<RoleGuard allowedRoles={['PHC_DOCTOR']}><DoctorInsightsPage /></RoleGuard>}
      />
      <Route
        path="doctor/clinical"
        element={<RoleGuard allowedRoles={['PHC_DOCTOR']}><ClinicalDashboardEntryPage /></RoleGuard>}
      />
      <Route
        path="doctor/review-request"
        element={<RoleGuard allowedRoles={['PHC_DOCTOR']}><ReviewRequestPage /></RoleGuard>}
      />

      {/* ── Cardiologist routes ───────────────────────────────────────── */}
      <Route
        path="cardiologist/dashboard"
        element={<RoleGuard allowedRoles={['CARDIOLOGIST']}><CardiologistDashboard /></RoleGuard>}
      />
      <Route
        path="cardiologist/queue"
        element={<RoleGuard allowedRoles={['CARDIOLOGIST']}><ReviewQueuePage /></RoleGuard>}
      />
      <Route
        path="cardiologist/reviews"
        element={<RoleGuard allowedRoles={['CARDIOLOGIST']}><CaseReviewsPage /></RoleGuard>}
      />
      <Route
        path="cardiologist/review/:reviewId"
        element={<RoleGuard allowedRoles={['CARDIOLOGIST']}><CaseReviewPage /></RoleGuard>}
      />
      <Route
        path="cardiologist/insights"
        element={<RoleGuard allowedRoles={['CARDIOLOGIST']}><CardiologistInsightsPage /></RoleGuard>}
      />
      <Route
        path="cardiologist/analytics"
        element={<RoleGuard allowedRoles={['CARDIOLOGIST']}><AnalyticsDashboardPage /></RoleGuard>}
      />
      <Route
        path="cardiologist/validation"
        element={<RoleGuard allowedRoles={['CARDIOLOGIST']}><ValidationDashboardPage /></RoleGuard>}
      />
      <Route
        path="cardiologist/annotation/:analysisId"
        element={<RoleGuard allowedRoles={['CARDIOLOGIST']}><AnnotationWorkspacePage /></RoleGuard>}
      />
      <Route
        path="cardiologist/ontology"
        element={<RoleGuard allowedRoles={['CARDIOLOGIST']}><OntologyRulesPage /></RoleGuard>}
      />

      {/* ── Patient routes ────────────────────────────────────────────── */}
      <Route
        path="patient/dashboard"
        element={<RoleGuard allowedRoles={['PATIENT']}><PatientDashboard /></RoleGuard>}
      />
      <Route
        path="patient/reports"
        element={<RoleGuard allowedRoles={['PATIENT']}><MyReportsPage /></RoleGuard>}
      />
      <Route
        path="patient/history"
        element={<RoleGuard allowedRoles={['PATIENT']}><HistoryPage /></RoleGuard>}
      />
      <Route
        path="patient/risk"
        element={<RoleGuard allowedRoles={['PATIENT']}><RiskSummaryPage /></RoleGuard>}
      />

      {/* ── Admin routes ──────────────────────────────────────────────── */}
      <Route
        path="admin/dashboard"
        element={<RoleGuard allowedRoles={['ADMIN']}><AdminDashboard /></RoleGuard>}
      />
      <Route
        path="admin/users"
        element={<RoleGuard allowedRoles={['ADMIN']}><UsersPage /></RoleGuard>}
      />
      <Route
        path="admin/roles"
        element={<RoleGuard allowedRoles={['ADMIN']}><RolesPage /></RoleGuard>}
      />
      <Route
        path="admin/audit"
        element={<RoleGuard allowedRoles={['ADMIN']}><AuditLogsPage /></RoleGuard>}
      />
      <Route
        path="admin/system"
        element={<RoleGuard allowedRoles={['ADMIN']}><SystemHealthPage /></RoleGuard>}
      />
      <Route
        path="admin/models"
        element={<RoleGuard allowedRoles={['ADMIN']}><ModelsPage /></RoleGuard>}
      />

      {/* ── Shared clinical routes (multi-role) ──────────────────────── */}
      <Route
        path="ecgupload"
        element={
          <RoleGuard allowedRoles={['PHC_DOCTOR', 'PATIENT']}>
            <ECGUpload />
          </RoleGuard>
        }
      />
      <Route
        path="questionnaire/:analysisId"
        element={
          <RoleGuard allowedRoles={['PHC_DOCTOR', 'CARDIOLOGIST']}>
            <HistoryQuestionnairePage />
          </RoleGuard>
        }
      />
      <Route
        path="clinical-dashboard/:analysisId"
        element={<AuthGuard><ClinicalDashboard /></AuthGuard>}
      />
      <Route
        path="analysis-failed/:analysisId"
        element={<AuthGuard><FailedAnalysisPage /></AuthGuard>}
      />

      {/* ── Patient management (Doctor + Cardiologist) ───────────────── */}
      {/* /patients/register MUST precede /patients/:patientId */}
      <Route
        path="patients/register"
        element={<RoleGuard allowedRoles={['PHC_DOCTOR']}><PatientRegistrationPage /></RoleGuard>}
      />
      <Route
        path="patients"
        element={<RoleGuard allowedRoles={['PHC_DOCTOR', 'CARDIOLOGIST']}><PatientListPage /></RoleGuard>}
      />
      <Route
        path="patients/:patientId"
        element={<RoleGuard allowedRoles={['PHC_DOCTOR', 'CARDIOLOGIST']}><PatientDetailPage /></RoleGuard>}
      />
      <Route
        path="patients/:id/ecg/:ecgId"
        element={<RoleGuard allowedRoles={['PHC_DOCTOR']}><ECGDetail /></RoleGuard>}
      />

      {/* ── Diagnosis detail (all authenticated users) ───────────────── */}
      <Route path="diagnosisdetail/:id/ecg/:ecgId" element={<AuthGuard><DiagnosisDetail /></AuthGuard>} />
      <Route path="diagnosisdetail/:id"             element={<AuthGuard><DiagnosisDetail /></AuthGuard>} />
      <Route path="diagnosisdetail"                 element={<AuthGuard><DiagnosisDetail /></AuthGuard>} />
    </Route>
  )
);

const App = () => {
  return (
    <div className="min-h-screen">
      <AuthProvider>
        <Toaster position="top-right" />
        <RouterProvider router={router} />
      </AuthProvider>
    </div>
  );
};

export default App;
