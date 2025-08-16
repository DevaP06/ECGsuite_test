import React from "react";
import { FaCloudUploadAlt, FaBolt, FaChartBar, FaArrowRight } from "react-icons/fa";
import { motion } from "framer-motion";

const steps = [
  {
    icon: <FaCloudUploadAlt className="text-cyan-400 text-4xl mb-3" />,
    title: "Upload ECG Data",
    description: "Securely upload ECG files from any device in seconds.",
  },
  {
    icon: <FaBolt className="text-yellow-400 text-4xl mb-3" />,
    title: "AI-Powered Analysis",
    description: "Advanced AI processes your data and identifies key insights instantly.",
  },
  {
    icon: <FaChartBar className="text-green-400 text-4xl mb-3" />,
    title: "Detailed Reports",
    description: "Get comprehensive, actionable reports for informed decisions.",
  },
];

const HowItWorks = () => {
  return (
    <section className="w-full flex flex-col items-center justify-center py-20 bg-black relative overflow-hidden">
      
      {/* Heading */}
      <motion.h2
        className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-500 bg-clip-text text-transparent text-center"
        initial={{ opacity: 0, x: -40 }}
        whileInView={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        viewport={{ once: true }}
      >
        How ECGenius Works
      </motion.h2>

      <motion.p
        className="text-gray-300 mb-14 max-w-2xl text-center text-lg md:text-xl"
        initial={{ opacity: 0, x: 40 }}
        whileInView={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2, duration: 0.8 }}
        viewport={{ once: true }}
      >
        Experience the future of cardiac care in three simple steps—secure, effortless, and powered by AI.
      </motion.p>

      {/* Steps */}
      <div className="flex flex-col md:flex-row justify-center gap-8 w-full max-w-5xl">
        {steps.map((step, idx) => (
          <motion.div
            key={idx}
            className="bg-gradient-to-br from-black/60 via-slate-900/80 to-purple-900/40 rounded-xl px-8 py-10 flex flex-col items-center shadow-lg border border-slate-800 hover:border-cyan-400/50 transition-all duration-300 hover:scale-[1.03]"
            initial={{ opacity: 0, x: idx % 2 === 0 ? -50 : 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 + idx * 0.15, duration: 0.7 }}
            viewport={{ once: true }}
          >
            <div className="w-12 h-12 flex items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-400 text-black font-bold text-lg mb-4 shadow-md">
              {idx + 1}
            </div>
            {step.icon}
            <h3 className="text-white text-xl font-semibold mb-2 text-center">{step.title}</h3>
            <p className="text-gray-300 text-base text-center">{step.description}</p>
          </motion.div>
        ))}
      </div>

      {/* CTA Button */}
      <motion.button
        className="mt-14 px-8 py-3 flex items-center justify-center gap-3 rounded-full font-semibold bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-blue-600 hover:to-cyan-500 transition-all duration-300 shadow-lg text-black text-lg focus:ring-4 focus:ring-cyan-400"
        onClick={() => window.location.href = "/get-started"}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.8 }}
        viewport={{ once: true }}
      >
        Get Started
        <FaArrowRight className="text-xl" />
      </motion.button>
    </section>
  );
};

export default HowItWorks;

