import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import heroVideo from '../assets/hero-bg.mp4';
import { Sparkles, HeartPulse } from 'lucide-react';
import WaitlistForm from './WaitlistForm';

const Hero = () => {
  const navigate = useNavigate();
  const [showWaitlist, setShowWaitlist] = useState(false);

  return (
    <section
      className="relative py-36 px-6 text-white min-h-[600px] flex items-center overflow-hidden font-[Inter]"
    >
      {/* Background Video */}
      <video
        className="absolute inset-0 w-full h-full object-cover z-0"
        src={heroVideo}
        autoPlay
        loop
        muted
        playsInline
      />

      {/* Subtle Overlay */}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-black/80 via-black/50 to-black-900/40" />

      {/* Bottom Gradient Fade */}
      <div
        className="absolute bottom-0 left-0 w-full h-16 pointer-events-none z-10"
        style={{
          background: "linear-gradient(to bottom, rgba(16,22,38,0) 0%, #101626 100%)"
        }}
      />

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto w-full text-center">

        {/* Beta Tag */}
        <div className="flex justify-center mb-6">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-700/80 text-sm font-semibold uppercase tracking-wide shadow-md">
            <HeartPulse className="w-5 h-5 text-blue-200" />
            ECGenius Beta
          </span>
        </div>

        {/* Main Headline */}
        <h1
          className="text-[2.75rem] md:text-[3.5rem] font-bold leading-tight mb-6 text-white tracking-tight"
        >
          AI-Powered Precision in <span className="text-blue-300">Cardiac Diagnostics</span>
        </h1>

        {/* Subheading */}
        <p className="text-lg md:text-xl text-gray-200 mb-10 max-w-2xl mx-auto leading-relaxed">
          Delivering lightning-fast, accurate ECG interpretations to empower medical professionals.
          <br />
          <span className="inline-flex items-center gap-1 text-blue-200 font-medium">
            <Sparkles className="w-5 h-5" /> Reliable insights. Better patient outcomes.
          </span>
        </p>

        {/* Buttons */}
        <div className="flex flex-wrap justify-center gap-6">
          <button
            onClick={() => setShowWaitlist(true)}
            className="relative overflow-hidden bg-blue-600 group text-white px-8 py-3 rounded-full font-semibold
            shadow-lg transition-all duration-300 hover:bg-blue-500 hover:scale-105 active:scale-95"
          >
            <span className="relative z-10">Join Waitlist</span>
          </button>

          <button
            onClick={() => navigate('/try-beta')}
            className="relative overflow-hidden bg-transparent border border-white/70 px-8 py-3 rounded-full font-semibold
            text-white shadow-md transition-all duration-300 hover:bg-white hover:text-black hover:scale-105 active:scale-95"
          >
            <span className="relative z-10">Try Beta Version</span>
          </button>
        </div>
      </div>

      {/* Waitlist Modal */}
      {showWaitlist && (
        <WaitlistForm 
          onClose={() => setShowWaitlist(false)}
          onSuccess={() => setShowWaitlist(false)}
        />
      )}
    </section>
  );
};

export default Hero;
