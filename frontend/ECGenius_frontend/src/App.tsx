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
