import ScrollTracker from "../components/ScrollTracker";
import Hero from "../components/Hero";
import WhyECGGenius from "../components/WhyECGGenius";
import Highlights from "../components/Highlights";
import Footer from "../components/Footer";
import ECGDiagnoses from "../components/ECGDiagnoses";

const HomePage = () => {
  return (
    <div className="min-h-screen bg-black text-white">
      <ScrollTracker />

      <Hero />

      
      <div className="mt-0"> 
        <WhyECGGenius />
      </div>
      <ECGDiagnoses />
      <Highlights />

      <Footer />
    </div>
  );
};

export default HomePage;
