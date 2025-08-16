
import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";


const MainLayout = () => {
  return (
    <div className="relative min-h-screen bg-black overflow-hidden">
      {/* CSS-only particle background */}
      <div className="absolute inset-0 z-0 particle-background"></div>

      {/* Foreground content */}
      <div className="relative z-10">
        <Navbar />
        <Outlet />
      </div>
    </div>
  );
};

export default MainLayout;