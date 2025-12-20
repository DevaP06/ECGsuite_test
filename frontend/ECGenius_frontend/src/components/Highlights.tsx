import { Brain, Lock, Zap, FlaskConical, Building2, GraduationCap } from "lucide-react";

const highlights = [
  {
    icon: <Brain className="h-16 w-16 text-white drop-shadow transition-transform duration-300 group-hover:scale-110" />,
    title: "Clinically Trained AI",
    bg: "bg-gradient-to-br from-emerald-500 via-green-500 to-teal-500 shadow-lg",
  },
  {
    icon: <Lock className="h-16 w-16 text-white drop-shadow transition-transform duration-300 group-hover:scale-110" />,
    title: "End-to-End Data Security",
    bg: "bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 shadow-lg",
  },
  {
    icon: <Zap className="h-16 w-16 text-white drop-shadow-2xl transition-transform duration-300 group-hover:scale-125 group-hover:rotate-12" />,
    title: "Real-Time ECG Insights",
    bg: "bg-gradient-to-br from-teal-500 via-cyan-500 to-blue-500 shadow-lg",
  },
  {
    icon: <Building2 className="h-16 w-16 text-white drop-shadow transition-transform duration-300 group-hover:scale-110" />,
    title: "DIC (MoE) Funded Startup",
    bg: "bg-gradient-to-br from-pink-500 via-rose-500 to-red-500 shadow-lg",
  },
  {
    icon: <FlaskConical className="h-16 w-16 text-white drop-shadow transition-transform duration-300 group-hover:scale-110" />,
    title: "Research Collaboration with Top Medical Institutes",
    bg: "bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 shadow-lg",
  },
  {
    icon: <GraduationCap className="h-16 w-16 text-white drop-shadow transition-transform duration-300 group-hover:scale-110" />,
    title: "Powered by Cutting-Edge Research",
    bg: "bg-gradient-to-br from-indigo-500 via-blue-600 to-violet-600 shadow-lg",
  },
];

export default function Highlights() {
  return (
    <section className="relative bg-[#101626] text-white py-20 px-4 sm:px-8 md:px-20 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-extrabold mb-4 text-center bg-gradient-to-r from-teal-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent drop-shadow">
          Highlights
        </h2>
        <p className="text-center text-lg text-gray-300 mb-12 max-w-xl mx-auto">
          Combining medical expertise and breakthrough AI for ECG clarity you can trust.
        </p>

        {/* Moving cards container */}
        <div className="relative w-full overflow-hidden">
          <div className="flex gap-10 animate-marquee">
            {highlights.concat(highlights).map((item, index) => (
              <div
                key={index}
                className={`group rounded-2xl p-12 flex flex-col items-center shadow-xl border border-white/10
                transition-transform duration-300 hover:scale-105 hover:shadow-2xl ${item.bg}`}
              >
                <div className="mb-6 flex items-center justify-center">
                  {item.icon}
                </div>
                <p className="text-lg font-bold text-center tracking-tight text-white drop-shadow">
                  {item.title}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          display: flex;
          width: max-content;
          animation: marquee 25s linear infinite;
        }
      `}</style>
    </section>
  );
}
