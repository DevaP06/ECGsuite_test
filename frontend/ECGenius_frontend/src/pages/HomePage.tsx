import ScrollTracker from "../components/ScrollTracker";
import Hero from "../components/Hero";
import WhyECGGenius from "../components/WhyECGGenius";
import Highlights from "../components/Highlights";
import Footer from "../components/Footer";

// import AnimatedAttributes from "../components/AnimatedAttributes";

const HomePage = () => {
  return (
    <div className="min-h-screen bg-black text-white">
      <ScrollTracker />

      <Hero />

      {/* Add spacing before next component */}
      <div className="mt-28">
        <WhyECGGenius />
      </div>
<Highlights></Highlights>
      {/* Footer can have spacing if needed later */}
      {/* <Footer /> */}
      <Footer></Footer>
    </div>

    
  );
};

export default HomePage;
