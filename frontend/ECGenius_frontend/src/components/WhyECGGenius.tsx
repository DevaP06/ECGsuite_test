
import { Brain, AlertTriangle, Stethoscope, Cloud } from "lucide-react";
import { motion } from "framer-motion";

const features = [
  {
    title: "AI-Driven ECG Analysis",
    description: "Deliver highly accurate ECG interpretations backed by advanced AI algorithms.",
    icon: <Brain className="h-12 w-12 text-blue-400" />,
  },
  {
    title: "Real-Time Anomaly Detection",
    description: "Identify cardiac irregularities instantly, enabling timely interventions.",
    icon: <AlertTriangle className="h-12 w-12 text-blue-400" />,
  },
  {
    title: "Clinician-Centered Design",
    description: "An interface optimized for medical workflows, reducing interpretation time.",
    icon: <Stethoscope className="h-12 w-12 text-blue-400" />,
  },
  {
    title: "Secure Cloud Access",
    description: "HIPAA-compliant cloud storage for safe, anytime access to patient data.",
    icon: <Cloud className="h-12 w-12 text-blue-400" />,
  },
];

const WhyECGGenius = () => {
  return (
    <motion.section
      className="relative bg-[#101626] text-white py-20 px-4 sm:px-8"  // Use same dark as hero bottom
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      viewport={{ once: true }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Heading */}
        <motion.h2
          className="text-4xl md:text-5xl font-bold mb-4 text-center text-white"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.7 }}
          viewport={{ once: true }}
        >
          Why <span className="text-blue-400">ECGenius</span>?
        </motion.h2>

        <motion.p
          className="text-center text-gray-300 text-lg mb-14 max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.7 }}
          viewport={{ once: true }}
        >
          Explore the core features that enhance diagnostic accuracy and empower healthcare professionals.
        </motion.p>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 justify-items-center">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className="group bg-zinc-900 p-7 rounded-xl shadow-md w-64 text-center border border-zinc-800
              hover:border-blue-400 hover:shadow-blue-500/20 transition-all duration-300 hover:scale-105"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.15, duration: 0.6 }}
              viewport={{ once: true }}
            >
              <div className="mb-6 flex justify-center">{feature.icon}</div>
              <p className="text-lg font-semibold text-blue-300 mb-1">{feature.title}</p>
              <p className="text-sm text-gray-300 leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
};

export default WhyECGGenius;
