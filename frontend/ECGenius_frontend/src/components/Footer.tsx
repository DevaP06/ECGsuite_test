import { Facebook, Twitter, Instagram, Linkedin } from "lucide-react";

const Footer: React.FC = () => (
  <footer className="bg-gray-900 text-gray-400 py-10 px-6 sm:px-12 md:px-24">
    <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-12">
      
      {/* Brand / Info */}
      <div className="flex flex-col space-y-3 max-w-sm">
        <h3 className="text-white font-bold text-2xl">ECGenius</h3>
        <p>
          AI-powered cardiac diagnostic tools to help medical professionals 
          improve patient outcomes.
        </p>
      </div>

      {/* Navigation links */}
      <nav className="flex flex-col sm:flex-row gap-12 text-sm">
        <div aria-label="Product Links">
          <h4 className="font-semibold text-white mb-2">Product</h4>
          <ul className="space-y-1">
            <li><a href="/try-beta" className="hover:text-teal-400 transition-colors">Try Beta</a></li>
            <li><a href="/how-it-works" className="hover:text-teal-400 transition-colors">How It Works</a></li>
            <li><a href="/pricing" className="hover:text-teal-400 transition-colors">Pricing</a></li>
          </ul>
        </div>

        <div aria-label="Company Links">
          <h4 className="font-semibold text-white mb-2">Company</h4>
          <ul className="space-y-1">
            <li><a href="/about" className="hover:text-teal-400 transition-colors">About Us</a></li>
            <li><a href="/careers" className="hover:text-teal-400 transition-colors">Careers</a></li>
            <li><a href="/contact" className="hover:text-teal-400 transition-colors">Contact</a></li>
            <li><a href="/privacy" className="hover:text-teal-400 transition-colors">Privacy Policy</a></li>
          </ul>
        </div>

        <div aria-label="Resource Links">
          <h4 className="font-semibold text-white mb-2">Resources</h4>
          <ul className="space-y-1">
            <li><a href="/blog" className="hover:text-teal-400 transition-colors">Blog</a></li>
            <li><a href="/docs" className="hover:text-teal-400 transition-colors">Documentation</a></li>
            <li><a href="/faq" className="hover:text-teal-400 transition-colors">FAQs</a></li>
            <li><a href="/support" className="hover:text-teal-400 transition-colors">Support</a></li>
          </ul>
        </div>
      </nav>

      {/* Social media icons */}
      <div className="flex flex-col space-y-3 items-start sm:items-end">
        <h4 className="font-semibold text-white mb-2">Follow Us</h4>
        <div className="flex space-x-4">
          <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="hover:text-teal-400 transition-colors">
            <Facebook size={22} />
          </a>
          <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter" className="hover:text-teal-400 transition-colors">
            <Twitter size={22} />
          </a>
          <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="hover:text-teal-400 transition-colors">
            <Instagram size={22} />
          </a>
          <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="hover:text-teal-400 transition-colors">
            <Linkedin size={22} />
          </a>
        </div>
      </div>
    </div>

    {/* Footer copyright */}
    <div className="border-t border-gray-800 mt-10 pt-6 text-center text-gray-500 text-xs">
      &copy; {new Date().getFullYear()} ECGenius. All rights reserved.
    </div>
  </footer>
);

export default Footer;
