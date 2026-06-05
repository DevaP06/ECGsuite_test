import { useState } from "react";
import { Bell, Search, Moon, Sun } from "lucide-react";
import { useAuth } from "../../features/auth/useAuth";
import { useNavigate } from "react-router-dom";

export default function TopBar() {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const { signout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    signout();
    navigate("/Sign-Up-Page");
  };


  return (
    <header className="flex justify-between items-center bg-white shadow px-6 py-3 sticky top-0 z-20">
      {/* Left: Title + Search */}
      <div className="flex items-center space-x-6">
        <h1 className="text-xl font-bold">Doctor Dashboard</h1>
        <div className="relative">
          <input
            type="text"
            placeholder="Search patients..."
            className="pl-9 pr-3 py-2 border rounded-md text-sm w-64 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
          <Search className="absolute left-2 top-2.5 w-4 h-4 text-gray-500" />
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center space-x-6 relative">
        {/* Dark mode toggle */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="p-2 rounded-full hover:bg-gray-100"
        >
          {darkMode ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className="w-5 h-5 text-gray-600" />}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-full hover:bg-gray-100"
          >
            <Bell className="w-5 h-5 text-gray-600" />
            <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">
              3
            </span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-64 bg-white shadow-lg rounded-md p-4 text-sm">
              <p className="font-bold mb-2">Notifications</p>
              <ul className="space-y-2">
                <li>✅ ECG uploaded successfully</li>
                <li>⚠️ New abnormal reading detected</li>
                <li>📅 Appointment tomorrow 10AM</li>
              </ul>
            </div>
          )}
        </div>

        {/* Profile menu */}
        <div className="relative">
          <img
            src="/assets/doctor.png"
            alt="Doctor"
            className="w-9 h-9 rounded-full border cursor-pointer"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
          />
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-40 bg-white shadow-lg rounded-md text-sm">
              <a href="/profile" className="block px-4 py-2 hover:bg-gray-100">Profile</a>
              <a href="/settings" className="block px-4 py-2 hover:bg-gray-100">Settings</a>
              <button onClick={handleLogout} className="block w-full text-left px-4 py-2 hover:bg-gray-100">Logout</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
