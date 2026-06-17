import Navbar from "../components/Navbar";
import BetaECGUploader from "../components/BetaECGUploader";
import Footer from "../components/Footer";

const TryBetaPage = () => {
  return (
    <main className="min-h-screen bg-black-900 flex flex-col">
      <Navbar />
      <div className="flex-1 flex flex-col items-center justify-start py-12 px-4">
        <BetaECGUploader />
      </div>
      <Footer />
    </main>
  );
};

export default TryBetaPage;
