import React from "react";
import { Brain, AlertTriangle, Stethoscope, Cloud } from "lucide-react";

const features = [
  {
    title: "AI-Driven ECG Reports",
    description: "Generate accurate ECG reports powered by advanced AI analysis.",
    icon: <Brain className="h-12 w-12 text-teal-400 drop-shadow-lg group-hover:animate-pulse" />,
  },
  {
    title: "Instant Anomaly Detection",
    description: "Detect heart irregularities in real-time with precision.",
    icon: <AlertTriangle className="h-12 w-12 text-teal-400 drop-shadow-lg group-hover:animate-pulse" />,
  },
  {
    title: "Doctor-Optimized UI",
    description: "Intuitive interface designed for medical professionals.",
    icon: <Stethoscope className="h-12 w-12 text-teal-400 drop-shadow-lg group-hover:animate-pulse" />,
  },
  {
    title: "Secure Cloud Access",
    description: "Access patient data securely from anywhere, anytime.",
    icon: <Cloud className="h-12 w-12 text-teal-400 drop-shadow-lg group-hover:animate-pulse" />,
  },
];

const WhyECGGenius = () => {
  return (
    <section className="relative bg-gradient-to-br from-black via-zinc-900 to-[#0f172a] text-white py-20 px-4 sm:px-8 overflow-hidden">
      {/* Subtle glowing accent blob */}
      <div className="pointer-events-none absolute left-0 top-0 w-48 h-48 bg-teal-400 opacity-10 blur-3xl rounded-full" />
      <div className="max-w-6xl mx-auto relative z-10">
        <h2 className="text-4xl md:text-5xl font-extrabold mb-3 text-center bg-gradient-to-r from-teal-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent drop-shadow">
          Why ECGenius?
        </h2>
        <p className="text-center text-gray-300 text-lg mb-14 max-w-2xl mx-auto">
          Discover the features that set us apart and empower clinicians for the future of cardiac care.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 justify-items-center">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group bg-gradient-to-br from-zinc-900/90 to-zinc-800/60 p-7 rounded-2xl shadow-2xl w-64 text-center border border-teal-400/10
              ring-0 hover:ring-4 hover:ring-teal-400/30 hover:border-teal-300
              hover:shadow-cyan-500/20 transform transition-all duration-300 hover:scale-105
              animate-feature-card"
              style={{ animationDelay: `${index * 180}ms` }}
            >
              <div className="mb-6 flex justify-center">{feature.icon}</div>
              <p className="text-lg font-semibold text-teal-300 mb-1">{feature.title}</p>
              <p className="text-sm text-gray-200">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
      {/* Custom animations */}
      <style>{`
        @keyframes appear {
          from { opacity: 0; transform: translateY(40px);}
          to { opacity: 1; transform: translateY(0);}
        }
        .animate-feature-card {
          opacity:0;
          animation: appear 0.95s cubic-bezier(0.4,0,0.2,1) both;
        }
      `}</style>
    </section>
  );
};

export default WhyECGGenius;
