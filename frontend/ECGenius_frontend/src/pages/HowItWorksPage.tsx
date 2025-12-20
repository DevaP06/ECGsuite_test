
import HowItWorks from '../components/HowItWorks';

import TimelineSection from '../components/TimelineSection';
import Footer from '../components/Footer';
import Navbar from '../components/Navbar';
const HowItWorksPage = () => {
  return (
    <div className="min-h-screen bg-gray-100 text-gray-800">
      {/* Hero Section */}
      <Navbar />
      <HowItWorks />

      {/* Three Steps Section */}
      {/* <ThreeStepsSection></ThreeStepsSection> */}

      {/* Timeline Section */}
      <TimelineSection></TimelineSection>

   <Footer></Footer>
    </div>
  );
};

export default HowItWorksPage;