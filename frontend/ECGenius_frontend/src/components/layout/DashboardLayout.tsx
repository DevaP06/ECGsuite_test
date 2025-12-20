import { useState } from "react";
import Sidebar from "../common/Sidebar";
import TopBar from "../common/TopBar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="flex">
      {/* Sidebar */}
      <Sidebar isOpen={isOpen} toggle={() => setIsOpen(!isOpen)} />

      {/* Right Side (Topbar + Content) */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          isOpen ? "ml-64" : "ml-20"
        }`}
      >
        <TopBar />
        <main className="p-6 bg-gray-50 min-h-screen">{children}</main>
      </div>
    </div>
  );
}
