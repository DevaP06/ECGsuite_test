import React from "react";
import PricingPlans from "../components/PricingPlans";          
import PlanComparisonTable from "../components/PlanComparisonTable";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
const PricingPage: React.FC = () => {
  return (
    <main className="bg-zinc-50 dark:bg-black min-h-screen">
      {/* Pricing Cards Section */}
      <Navbar />
      <PricingPlans />

      {/* Feature Comparison Table Section */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <PlanComparisonTable />
      </div>
      <Footer />
    </main>
  );
};

export default PricingPage;
