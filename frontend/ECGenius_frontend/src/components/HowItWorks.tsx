import React from "react";
import { FaCloudUploadAlt, FaBolt, FaChartBar, FaArrowRight } from "react-icons/fa";

const steps = [
  {
    icon: <FaCloudUploadAlt className="text-blue-400 text-4xl mb-3 animate-bounce" />,
    title: "Upload ECG Data",
    description: "Easily upload your ECG files from any device, securely and instantly.",
  },
  {
    icon: <FaBolt className="text-yellow-400 text-4xl mb-3 animate-pulse" />,
    title: "AI-Powered Analysis",
    description: "Our AI processes the data and highlights important findings in seconds.",
  },
  {
    icon: <FaChartBar className="text-green-400 text-4xl mb-3 animate-spin-slow" />,
    title: "Get Detailed Reports",
    description: "Receive actionable reports and visualizations to aid your clinical decisions.",
  },
];

const spinSlowCss = `
@keyframes spin-slow {
  to { transform: rotate(360deg); }
}
.animate-spin-slow {
  animation: spin-slow 3.5s linear infinite;
}
`;

const HowItWorks: React.FC = () => (
  <section className="w-full flex flex-col items-center justify-center py-20 bg-black relative overflow-x-hidden">
    <style>{spinSlowCss}</style>
    {/* Title and Summary */}
    <h2 className="text-4xl md:text-5xl font-extrabold mb-3 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent drop-shadow text-center animate-fadein">
      How ECGenius Works
    </h2>
    <p className="text-gray-200 mb-12 max-w-2xl text-center text-lg md:text-xl animate-fadein animate-delay-300">
      Revolutionize your workflow in just three simple steps—secure, effortless, and powered by next-gen AI.
    </p>
    {/* Steps row */}
    <div className="flex flex-col md:flex-row justify-center gap-8 w-full max-w-4xl relative">

      {steps.map((step, idx) => (
        <React.Fragment key={step.title}>
          {/* Connector (only on md+ between cards) */}
          {idx !== 0 && (
            <div
              className="hidden md:block absolute top-1/2 left-0 right-0"
              style={{
                left: `calc(33.33% * ${idx})`,
                width: '40px',
                transform: 'translateY(-50%)',
                zIndex: 2,
              }}
              aria-hidden="true"
            >
              <div className="h-1 w-full bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 opacity-40 rounded-full"></div>
            </div>
          )}

          {/* Step Card */}
          <div
            className={`relative group bg-gradient-to-br from-black/50 via-slate-900/80 to-purple-900/50 
              hover:from-purple-900/60 hover:to-black/80 transition
              backdrop-blur-lg rounded-xl px-8 py-10 flex flex-col items-center shadow-xl border-2 border-slate-700
              ${idx % 2 === 0
                ? "animate-fadein-l slide-in-left"
                : idx === 2
                  ? "animate-fadein-r slide-in-right"
                  : "animate-fadein slide-in-top"
              }`}
            style={{
              animationDelay: `${200 + idx * 180}ms`,
              zIndex: 3
            }}
          >
            {/* Step Circle */}
            <span className="absolute -top-6 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 w-11 h-11 flex items-center justify-center text-xl font-bold text-black shadow-lg border-4 border-black/30">
              {idx + 1}
            </span>
            {/* Icon/Title/Desc */}
            {step.icon}
            <h3 className="text-white text-xl font-semibold mb-2 text-center">{step.title}</h3>
            <p className="text-blue-100 text-base text-center">{step.description}</p>
          </div>
        </React.Fragment>
      ))}
    </div>
    {/* Action Button */}
    <button
      className="mt-14 px-9 py-3 flex items-center justify-center gap-3 rounded-full font-bold bg-gradient-to-r from-purple-500 to-blue-500 hover:from-blue-700 hover:to-pink-600
      active:bg-blue-800 shadow-lg text-white text-lg transition focus:ring-4 focus:ring-blue-400 focus:outline-none animate-fadein animate-delay-700"
      tabIndex={0}
      aria-label="Get Started with ECGenius"
      onClick={() => window.location.href = "/get-started"}
    >
      Get Started
      <FaArrowRight className="text-xl animate-bounce-x" />
    </button>
    {/* Custom Animations */}
    <style>{`
      @keyframes fadein { from {opacity:0;} to {opacity:1;} }
      .animate-fadein { animation: fadein 1s cubic-bezier(0.4, 0, 0.2, 1) 1 normal both; }
      .animate-delay-300 { animation-delay: 0.3s !important; }
      .animate-delay-700 { animation-delay: 0.7s !important; }

      @keyframes slide-in-left { from { transform:translateX(-50px); opacity:0;} to { transform:translateX(0); opacity:1;} }
      @keyframes slide-in-right { from { transform:translateX(50px); opacity:0;} to { transform:translateX(0); opacity:1;} }
      @keyframes slide-in-top { from { transform:translateY(-40px); opacity:0;} to { transform:translateY(0); opacity:1;} }
      .slide-in-left { animation: slide-in-left 0.85s cubic-bezier(0.4, 0, 0.2, 1) both; }
      .slide-in-right { animation: slide-in-right 0.85s cubic-bezier(0.4, 0, 0.2, 1) both; }
      .slide-in-top { animation: slide-in-top 0.85s cubic-bezier(0.4, 0, 0.2, 1) both; }

      @keyframes bounce-x { 0%,100%{transform:translateX(0);} 50%{transform:translateX(6px);} }
      .animate-bounce-x { animation: bounce-x 1.1s infinite; }
    `}</style>
  </section>
);

export default HowItWorks;

