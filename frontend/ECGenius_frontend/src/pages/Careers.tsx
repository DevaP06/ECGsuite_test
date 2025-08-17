import React from "react";
import CareersHero from "../components/CareersHero"; // ✅ Make sure path is correct
import WhyWorkWithUs from "../components/WhyWorkWithUs";
import OpenPositions from "../components/OpenPositions";
import Footer from "../components/Footer";
const Careers: React.FC = () => {
  return (
    <div className="bg-black min-h-screen">
      <CareersHero />
      <WhyWorkWithUs />
      <OpenPositions />
      <Footer />
      {/* You can add more sections as needed */}
    </div>
  );
};

export default Careers;
