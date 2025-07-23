
import logo from "../assets/ECGenius_logo.png";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFacebookF,
  faInstagram,
  faTelegramPlane,
  faLinkedinIn,
  faYoutube,
  faXTwitter,
} from "@fortawesome/free-brands-svg-icons";

const Footer = () => {
  return (
    <footer className="bg-black text-white py-16 px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-16 items-start">
        {/* Logo Section */}
        <div className="flex flex-col items-center md:items-start">
          <img
            src={logo}
            alt="Company Logo"
            className="w-24 h-24 rounded-full"
          />
          <p className="mt-4 text-sm text-gray-400 text-center md:text-left max-w-xs">
            About the company
          </p>
        </div>

        {/* Company Links */}
        <div className="flex flex-col items-center md:items-start">
          <h3 className="text-xl font-semibold mb-4">Company</h3>
          <ul className="space-y-3 text-base text-gray-300">
            <li>
              <a href="/about-us" className="hover:text-white transition">
                About Us
              </a>
            </li>
            <li>
              <a href="/faqs" className="hover:text-white transition">
                FAQs
              </a>
            </li>
            <li>
              <a href="/contact" className="hover:text-white transition">
                Contact Us
              </a>
            </li>
          </ul>
        </div>

        {/* Social Icons */}
        <div className="flex flex-col items-center md:items-start">
          <h3 className="text-xl font-semibold mb-4">Follow us</h3>
          <div className="flex flex-wrap gap-5 text-white text-lg">
            <a href="#" target="_blank" rel="noopener noreferrer">
              <FontAwesomeIcon icon={faFacebookF} className="hover:text-blue-500 transition" />
            </a>
            <a href="#" target="_blank" rel="noopener noreferrer">
              <FontAwesomeIcon icon={faInstagram} className="hover:text-pink-500 transition" />
            </a>
            <a href="#" target="_blank" rel="noopener noreferrer">
              <FontAwesomeIcon icon={faTelegramPlane} className="hover:text-sky-400 transition" />
            </a>
            <a href="#" target="_blank" rel="noopener noreferrer">
              <FontAwesomeIcon icon={faLinkedinIn} className="hover:text-blue-400 transition" />
            </a>
            <a href="#" target="_blank" rel="noopener noreferrer">
              <FontAwesomeIcon icon={faYoutube} className="hover:text-red-500 transition" />
            </a>
            <a href="#" target="_blank" rel="noopener noreferrer">
              <FontAwesomeIcon icon={faXTwitter} className="hover:text-gray-300 transition" />
            </a>
          </div>
        </div>
      </div>

      <div className="mt-12 text-center text-xs text-gray-500">
        © 2025 ECGenius. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;

