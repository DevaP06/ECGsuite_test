// pages/try-beta.tsx
import Navbar from "../components/Navbar";
import type { NextPage } from "next";
import BetaECGUploader from "../components/BetaECGUploader";

const TryBetaPage: NextPage = () => {
  return (
    <main className="min-h-screen bg-black-900 flex flex-col items-center justify-start py-12 px-4">
      <Navbar />
      <BetaECGUploader />
    </main>
  );
};

export default TryBetaPage;
