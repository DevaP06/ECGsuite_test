import {
  createBrowserRouter,
  createRoutesFromElements,
  RouterProvider,
  Route,
} from 'react-router-dom';

import MainLayout from './pages/MainLayout';
import HomePage from './pages/HomePage';
import About from './pages/About';
// import ConfirmEmail from './pages/ConfirmEmail';
import NotFound from './pages/NotFound';
import HowItWorksPage from './pages/HowItWorksPage';
import PricingPage from './pages/PricingPage'; // <-- Import your pricing page
import ContactPage from './pages/ContactPage';
import TryBetaPage from './pages/TryBetaPage';
import SignUpPage from './pages/SignUpPage';
import Careers from './pages/Careers'; // Import the Careers page
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import PatientDetail from './pages/PatientDetail';
import ECGDetail from './pages/ECGDetails';
import ECGUpload from './pages/ECGUpload';
import DiagnosisDetail from './pages/DiagnosisDetail';

import { AuthProvider } from './features/auth/useAuth';
import AuthGuard from './components/common/AuthGuard';
import { Toaster } from 'react-hot-toast';

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<MainLayout />}>
      <Route index element={<HomePage />} />
      <Route path="about" element={<About />} />
      {/* <Route path="verify-email" element={<ConfirmEmail />} /> */}
      <Route path="how-it-works" element={<HowItWorksPage />} />
      <Route path="pricing" element={<PricingPage />} /> {/* <-- Pricing route */}
      <Route path="*" element={<NotFound />} />
       <Route path="Contact" element={<ContactPage />} />
        <Route path="try-beta" element={<TryBetaPage />} />
        <Route path= "Sign-Up-Page" element = {<SignUpPage />} />
        <Route path="careers" element={<Careers />} />
        
        {/* Protected Routes */}
        <Route path="dashboard" element={<AuthGuard><Dashboard /></AuthGuard>} />
        <Route path="patients" element={<AuthGuard><Patients /></AuthGuard>} />
        <Route path="patients/:id" element={<AuthGuard><PatientDetail /></AuthGuard>} />
        <Route path="patients/:id/ecg/:ecgId" element={<AuthGuard><ECGDetail /></AuthGuard>} />
        <Route path="ecgupload" element={<AuthGuard><ECGUpload /></AuthGuard>} />
        <Route path="diagnosisdetail/:id/ecg/:ecgId" element={<AuthGuard><DiagnosisDetail /></AuthGuard>} />
        <Route path="diagnosisdetail/:id" element={<AuthGuard><DiagnosisDetail /></AuthGuard>} />
        <Route path="diagnosisdetail" element={<AuthGuard><DiagnosisDetail /></AuthGuard>} />

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

