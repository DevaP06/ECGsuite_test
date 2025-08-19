import { motion } from "framer-motion";
import ECGAnalysisImg from "../assets/ecg-analysis.png";
import AnomalyDetectionImg from "../assets/anomaly-detection.png";
import ClinicianDesignImg from "../assets/clinician-design.png";

const features = [
  {
    title: "AI-Driven ECG Analysis",
    description: "Deliver highly accurate ECG interpretations backed by advanced AI algorithms.",
    image: ECGAnalysisImg,
  },
  {
    title: "Real-Time Anomaly Detection",
    description: "Identify cardiac irregularities instantly, enabling timely interventions.",
    image: AnomalyDetectionImg,
  },
  {
    title: "Clinician-Centered Designs",
    description: "An interface optimized for medical workflows, reducing interpretation time.",
    image: ClinicianDesignImg,
  },
];

const WhyECGGenius = () => {
  return (
    <motion.section
      className="relative bg-[#101626] text-white py-16 px-4 sm:px-8 lg:px-12"
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      viewport={{ once: true }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Heading */}
        <motion.h2
          className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 text-center"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.7 }}
          viewport={{ once: true }}
        >
          Why <span className="text-blue-400">ECGenius</span>?
        </motion.h2>

        <motion.p
          className="text-center text-gray-300 text-base sm:text-lg mb-12 max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.7 }}
          viewport={{ once: true }}
        >
          Explore the core features that enhance diagnostic accuracy and empower healthcare professionals.
        </motion.p>

        {/* Feature Cards */}
        <div className="flex flex-col sm:flex-row sm:flex-wrap justify-center gap-6 sm:gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className="bg-[#101626] p-6 rounded-lg shadow-md w-full sm:w-80 text-center border border-zinc-800 hover:border-blue-400 transition-all duration-300"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.15, duration: 0.6 }}
              viewport={{ once: true }}
            >
              <div className="mb-4 flex justify-center">
                <img
                  src={feature.image}
                  alt={feature.title}
                  className="h-24 sm:h-32 w-auto object-contain"
                />
              </div>
              <h3 className="text-lg font-semibold text-blue-300 mb-2">
                {feature.title}
              </h3>
              <p className="text-sm sm:text-base text-gray-300 mb-4">
                {feature.description}
              </p>
              <a
                href="#"
                className="text-blue-400 text-sm hover:underline"
              >
                Learn more →
              </a>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
};

export default WhyECGGenius;
