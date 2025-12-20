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
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="patients" element={<Patients />} />
        <Route path="patients/:id" element={<PatientDetail />} />
        <Route path="patients/:id/ecg/:ecgId" element={<ECGDetail />} />
        <Route path="ecgupload" element={<ECGUpload />} />
        <Route path="diagnosisdetail/:id/ecg/:ecgId" element={<DiagnosisDetail />} />
        <Route path="diagnosisdetail" element={<DiagnosisDetail />} />

    </Route>
  )
);

const App = () => {
  return (
    <div className="min-h-screen">
      <RouterProvider router={router} />
    </div>
  );
};

export default App;
