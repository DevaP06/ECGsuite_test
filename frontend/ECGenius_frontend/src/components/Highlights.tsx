
import { Brain, Lock, Zap } from "lucide-react";

const highlights = [
  {
    icon: <Brain className="h-16 w-16 text-black transition-transform duration-300 group-hover:scale-110" />,
    title: "Clinically Trained AI",
    bg: "bg-white",
  },
  {
    icon: <Lock className="h-16 w-16 text-black transition-transform duration-300 group-hover:scale-110" />,
    title: "End-to-End Data Security",
    bg: "bg-white",
  },
  {
    icon: <Zap className="h-16 w-16 text-white drop-shadow-2xl transition-transform duration-300 group-hover:scale-125 group-hover:rotate-12" />,
    title: "Real-Time ECG Insights",
    bg: "bg-gradient-to-br from-teal-500 via-cyan-500 to-blue-500 shadow-lg",
  },
];

export default function Highlights() {
  return (
    <section className="relative bg-[#101626] text-white py-20 px-4 sm:px-8 md:px-20">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-extrabold mb-4 text-center bg-gradient-to-r from-teal-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent drop-shadow">
          Highlights
        </h2>
        <p className="text-center text-lg text-gray-300 mb-12 max-w-xl mx-auto">
          Combining medical expertise and breakthrough AI for ECG clarity you can trust.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10">
          {highlights.map((item, index) => (
            <div
              key={index}
              className={`group rounded-2xl p-12 flex flex-col items-center shadow-xl border border-white/10
              transition-transform duration-300 hover:scale-105 hover:shadow-2xl
              ${item.bg} animate-highlight-card`}
              style={{ animationDelay: `${index * 200}ms` }}
            >
              <div className="mb-6 flex items-center justify-center">
                {item.icon}
              </div>
              <p
                className={`text-lg font-bold text-center tracking-tight ${
                  item.bg === "bg-white"
                    ? "text-black"
                    : "text-white drop-shadow"
                }`}
              >
                {item.title}
              </p>
            </div>
          ))}
        </div>
      </div>
      {/* Card and icon animations */}
      <style>{`
        @keyframes highlight-appear {
          0% { opacity:0; transform:translateY(60px) scale(.97);}
          100% { opacity:1; transform:translateY(0) scale(1);}
        }
        .animate-highlight-card {
          opacity:0;
          animation: highlight-appear .95s cubic-bezier(.4,0,.2,1) both;
        }
      `}</style>
    </section>
  );
}
