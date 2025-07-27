import { Link } from "react-router-dom";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import logo from "../assets/ECGenius_logo.png";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { name: "About", path: "/about" },
    { name: "How It Works", path: "/how-it-works" },
    { name: "Pricing", path: "/pricing" },
    { name: "Contact", path: "/contact" },
    { name: "Login", path: "/login" },
  ];

  return (
    <nav className="bg-black shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
        {/* Logo (Leftmost) */}
        <Link
          to="/"
          className="flex items-center gap-3 text-xl font-bold text-white"
        >
          <img src={logo} alt="ECGenius Logo" className="h-9 w-9 object-contain" />
          <span className="tracking-tight">ECGenius</span>
        </Link>

        {/* Right Section: Desktop Nav + Hamburger Icon */}
        <div className="flex items-center">
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className="text-white hover:text-blue-400 font-medium transition-colors"
              >
                {item.name}
              </Link>
            ))}

            <Link
              to="/Sign-Up-page"
              className="ml-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-semibold whitespace-nowrap"
            >
              Get Started
            </Link>
          </div>

          {/* Hamburger icon for Mobile */}
          <button
            className="md:hidden text-white ml-4"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown */}
      {isOpen && (
        <div className="md:hidden px-4 pb-4 pt-2 space-y-2 bg-black border-t border-gray-800">
          {navItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className="block py-2 text-white hover:text-blue-400 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              {item.name}
            </Link>
          ))}

          <Link
            to="/Sign-Up-page"  // Corrected path for consistency
            className="block w-full text-center bg-blue-600 text-white px-4 py-2 rounded-lg mt-2 hover:bg-blue-700 transition-colors font-semibold"
            onClick={() => setIsOpen(false)}
          >
            Get Started
          </Link>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
