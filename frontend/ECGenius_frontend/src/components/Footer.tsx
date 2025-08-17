import { Facebook, Twitter, Instagram, Linkedin } from "lucide-react";

const Footer: React.FC = () => (
  <footer className="bg-gray-900 text-gray-400 py-10 px-6 sm:px-12 md:px-24">
    <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-8">
      
      {/* Brand / Info */}
      <div className="flex flex-col space-y-2">
        <h3 className="text-white font-bold text-xl">ECGenius</h3>
        <p className="max-w-xs text-gray-400">
          AI-powered cardiac diagnostic tools to help medical professionals improve patient outcomes.
        </p>
      </div>

      {/* Navigation links */}
      <nav className="flex flex-col sm:flex-row gap-12">
        <div>
          <h4 className="font-semibold text-white mb-2">Product</h4>
          <ul className="space-y-1">
            <li><a href="/try-beta" className="hover:text-teal-400">Try Beta</a></li>
            <li><a href="/how-it-works" className="hover:text-teal-400">How It Works</a></li>
            <li><a href="/pricing" className="hover:text-teal-400">Pricing</a></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-white mb-2">Company</h4>
          <ul className="space-y-1">
            <li><a href="/about" className="hover:text-teal-400">About Us</a></li>
            <li><a href="/careers" className="hover:text-teal-400">Careers</a></li>
            <li><a href="/contact" className="hover:text-teal-400">Contact</a></li>
            <li><a href="/privacy" className="hover:text-teal-400">Privacy Policy</a></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-white mb-2">Resources</h4>
          <ul className="space-y-1">
            <li><a href="/blog" className="hover:text-teal-400">Blog</a></li>
            <li><a href="/docs" className="hover:text-teal-400">Documentation</a></li>
            <li><a href="/faq" className="hover:text-teal-400">FAQs</a></li>
            <li><a href="/support" className="hover:text-teal-400">Support</a></li>
          </ul>
        </div>
      </nav>

      {/* Social media icons */}
      <div className="flex flex-col space-y-2 items-start sm:items-end">
        <h4 className="font-semibold text-white mb-2">Follow Us</h4>
        <div className="flex space-x-4">
          <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="hover:text-teal-400">
            <Facebook size={24} />
          </a>
          <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter" className="hover:text-teal-400">
            <Twitter size={24} />
          </a>
          <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="hover:text-teal-400">
            <Instagram size={24} />
          </a>
          <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="hover:text-teal-400">
            <Linkedin size={24} />
          </a>
        </div>
      </div>
    </div>

    {/* Footer copyright */}
    <div className="border-t border-gray-800 mt-10 pt-6 text-center text-gray-500 text-sm select-none">
      &copy; {new Date().getFullYear()} ECGenius. All rights reserved.
    </div>
  </footer>
);

export default Footer;
