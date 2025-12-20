import { Home, Users, Upload, Activity } from "lucide-react";
import ecgLogo from "../../assets/ECGenius_logo.png";

interface SidebarProps {
  isOpen: boolean;
  toggle: () => void;
}

export default function Sidebar({ isOpen, toggle }: SidebarProps) {
  return (
    <aside
      className={`${
        isOpen ? "w-64" : "w-20"
      } bg-gray-900 text-white h-screen p-4 transition-all duration-300 fixed left-0 top-0`}
    >
      {/* Logo + Brand */}
      <div className="flex items-center cursor-pointer mb-8" onClick={toggle}>
        <img src={ecgLogo} alt="ECGenius" className="w-10 h-10" />
        {isOpen && <span className="ml-3 text-xl font-bold">ECGenius</span>}
      </div>

      {/* Navigation */}
      <nav className="space-y-3">
        <a href="/dashboard" className="flex items-center gap-3 hover:bg-gray-700 p-2 rounded">
          <Home className="w-5 h-5" />
          {isOpen && <span>Dashboard</span>}
        </a>
        <a href="/patients" className="flex items-center gap-3 hover:bg-gray-700 p-2 rounded">
          <Users className="w-5 h-5" />
          {isOpen && <span>Patients</span>}
        </a>
        <a href="/ecgupload" className="flex items-center gap-3 hover:bg-gray-700 p-2 rounded">
          <Upload className="w-5 h-5" />
          {isOpen && <span>Upload ECG</span>}
        </a>
        <a href="/diagnosisdetail" className="flex items-center gap-3 hover:bg-gray-700 p-2 rounded">
          <Activity className="w-5 h-5" />
          {isOpen && <span>AI Insights</span>}
        </a>
      </nav>
    </aside>
  );
}
