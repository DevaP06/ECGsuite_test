import { useNavigate } from 'react-router-dom';
import heroBg from '../assets/hero-bg.jpg';
import { Sparkles, HeartPulse } from 'lucide-react';

const Hero = () => {
  const navigate = useNavigate();

  return (
    <section
      className="relative bg-cover bg-center bg-no-repeat py-36 px-6 text-white min-h-[600px] flex items-center"
      style={{
        backgroundImage: `url(${heroBg})`,
      }}
    >
      {/* Layered gradient and blur overlays */}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-black/80 via-black/40 to-purple-900/60 backdrop-blur-sm" />

      <div className="relative z-10 max-w-5xl mx-auto w-full text-center">
        {/* Animated badge/icon */}
        <div className="flex justify-center mb-6">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-600/80 text-sm font-bold uppercase shadow-lg animate-pulse">
            <HeartPulse className="w-5 h-5 text-pink-300 animate-bounce" />
            ECGenius Beta
          </span>
        </div>
        {/* Main Headline */}
        <h1
          className="text-5xl md:text-6xl font-extrabold leading-tight mb-6 
          bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 
          bg-clip-text text-transparent drop-shadow-lg 
          animate-in fade-in slide-in-from-top-8"
        >
          Your <span className="text-white">AI-Powered</span> Partner<br />in{' '}
          <span className="text-pink-400">Cardiac Diagnostics</span>
        </h1>
        <p className="text-xl md:text-2xl text-gray-100 mb-10 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-8 delay-150">
          Lightning-fast, accurate, and effortless ECG interpretation for medical professionals.
          <br />
          <span className="inline-flex items-center gap-1 text-pink-300 font-semibold">
            <Sparkles className="w-5 h-5" /> Smarter decisions, better outcomes.
          </span>
        </p>
        <div className="flex flex-wrap justify-center gap-6">
          <button
            className="relative overflow-hidden bg-white group text-black px-8 py-3 rounded-full font-semibold
            shadow-xl transition-all duration-300 hover:scale-105 ring-2 ring-white/30 active:scale-95"
            // Add your Join Waitlist click handler here if needed
          >
            <span className="relative z-10">Join Waitlist</span>
            <span className="absolute inset-0 z-0 bg-gradient-to-r from-pink-300 to-blue-300 opacity-0 group-hover:opacity-20 transition"></span>
          </button>
          <button
            onClick={() => navigate('/try-beta')}
            className="relative overflow-hidden bg-white/0 border border-white px-8 py-3 rounded-full font-semibold
            text-white shadow-lg transition-all duration-300 hover:bg-white hover:text-black ring-white/10 hover:scale-105
            active:scale-95 cursor-pointer"
          >
            <span className="relative z-10">Try Beta Version</span>
            <span className="absolute inset-0 z-0 bg-gradient-to-r from-purple-400/40 to-blue-400/40 opacity-0 group-hover:opacity-20 transition"></span>
          </button>
        </div>
      </div>
    </section>
  );
};

export default Hero;
