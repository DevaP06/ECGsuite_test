import React from "react";
import { motion } from "framer-motion";

const MissionSection = () => {
  return (
    <section className="relative bg-black text-white py-20 px-4 overflow-hidden">
      {/* Soft texture overlay */}
      <div className="absolute inset-0 bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAERlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAGKADAAQAAAABAAAAGAAAAADQ8G4QAAAAJcEhZcwAADsQAAA7EAZUrDhsAAAAHUlEQVQI12NgYGAwMTAwPeH8/4/ADAAo8D9+9Y4m0QAAAABJRU5ErkJggg==')] bg-repeat opacity-5 z-0" />

      <div className="relative z-10 max-w-4xl mx-auto text-center">
        {/* Heading */}
        <motion.h2
          className="text-4xl font-extrabold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-500 bg-clip-text text-transparent mb-6"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
        >
          Our Mission
        </motion.h2>

        {/* Description */}
        <motion.p
          className="text-lg text-gray-200 mb-14 max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.7 }}
          viewport={{ once: true }}
        >
          At ECGenius, our mission is to transform cardiac diagnostics through intelligent, accessible, and reliable AI solutions — empowering clinicians and saving lives with every heartbeat.
        </motion.p>

        {/* Mission points */}
        <div className="space-y-8">
          {[
            {
              title: "Innovation at Our Core",
              text: "We harness the latest in artificial intelligence and medical research to deliver fast, accurate ECG interpretations — setting new standards for cardiac care.",
              gradient: "from-cyan-400 to-blue-500",
            },
            {
              title: "Trust and Accessibility",
              text: "Every patient deserves the best. We’re building technology that bridges healthcare gaps, ensuring accurate heart diagnostics are available to everyone, everywhere.",
              gradient: "from-blue-400 to-purple-500",
            },
            {
              title: "Empowerment through Knowledge",
              text: "Our platform equips healthcare professionals and patients with clear, actionable insights — enabling informed decisions and healthier outcomes.",
              gradient: "from-purple-400 to-cyan-400",
            },
          ].map((item, idx) => (
            <motion.div
              key={item.title}
              className="group bg-black/80 rounded-2xl border border-cyan-400/20 shadow-md hover:shadow-cyan-500/20 hover:border-cyan-400 transition-all duration-300 p-8"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.15, duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h3
                className={`text-xl font-bold mb-2 bg-gradient-to-r ${item.gradient} bg-clip-text text-transparent`}
              >
                {item.title}
              </h3>
              <p className="text-base text-gray-300">{item.text}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default MissionSection;
