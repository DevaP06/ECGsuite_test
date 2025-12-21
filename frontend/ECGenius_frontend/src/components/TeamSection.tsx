import { motion } from "framer-motion";
import { Linkedin } from "lucide-react";

const TeamSection = () => {
 const teamMembers = [
  {
    name: "Dhruv Pekhale",
    role: "Backend & Integration",
    description:
      "Manages backend systems, APIs, and ensures smooth communication between ECG devices and the platform. Experienced in system architecture and deployment for reliability.",
    linkedin:
      "https://www.linkedin.com/in/dhruv-pekhale-a8061431b?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app",
  },
  {
    name: "Karmanya Belsare",
    role: "AI & Data Processing",
    description:
      "Specializes in building robust data pipelines, preprocessing ECG signals, and enhancing AI accuracy. Dedicated to making raw medical data usable for meaningful insights.",
    linkedin: "https://www.linkedin.com/in/karmanya-belsare-2597a8335/",
  },
  {
    name: "Shekhar Deshmukh",
    role: "AI Model Development",
    description:
      "Focuses on training and fine-tuning deep learning models for accurate ECG analysis. Passionate about leveraging neural networks to detect patterns in biomedical data.",
    linkedin:
      "https://www.linkedin.com/in/shekhar-deshmukh-a94a62359?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app",
  },
  {
    name: "Yash Ghule",
    role: "Research & Development",
    description:
      "Explores the fusion of AI with medical insights, drives innovation, and shapes the vision of ECGenius. Works on integrating clinical expertise with cutting-edge technology.",
    linkedin: "https://www.linkedin.com/in/yash-ghule-324b9922b/",
  },
  {
    name: "Devashish Pundkar",
    role: "Technical Lead",
    description:
      "Oversees the technical direction and ensures seamless collaboration between AI, backend, and frontend teams. Skilled in bridging innovation with practical execution.",
    linkedin:
      "https://www.linkedin.com/in/devashish-pundkar-808b29324?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app",
  },

  // 🔹 Newly Joined Medical Experts
  {
    name: "Palak Shah",
    role: "Medical Expert",
    description:
      "Provides clinical insights for ECG interpretation and validation. Ensures that AI outputs align with real-world cardiology practices and patient safety standards.",
    linkedin: "#",
  },
  {
    name: "Tanvi Lakhmawar",
    role: "Medical Expert",
    description:
      "Contributes medical expertise in cardiac physiology and diagnostics, helping bridge the gap between AI predictions and clinical decision-making.",
    linkedin: "#",
  },
  {
    name: "Aditi Jain",
    role: "Medical Expert",
    description:
      "Supports model validation from a medical perspective and assists in refining ECG analysis workflows for accuracy and clinical relevance.",
    linkedin: "#",
  },
  {
    name: "Sanika Motewar",
    role: "Medical Expert",
    description:
      "Works on medical review and interpretation of ECG patterns, ensuring the system adheres to established healthcare standards and practices.",
    linkedin: "#",
  },
];


  return (
    <section className="relative bg-black text-white py-20 px-4 overflow-hidden">
      {/* Soft texture overlay */}
      <div className="absolute inset-0 bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAERlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAGKADAAQAAAABAAAAGAAAAADQ8G4QAAAAJcEhZcwAADsQAAA7EAZUrDhsAAAAHUlEQVQI12NgYGAwMTAwPeH8/4/ADAAo8D9+9Y4m0QAAAABJRU5ErkJggg==')] bg-repeat opacity-5 z-0" />

      <div className="relative z-10 max-w-6xl mx-auto text-center">
        <motion.h2
          className="text-4xl font-extrabold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-500 bg-clip-text text-transparent mb-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          viewport={{ once: true }}
        >
          Meet Our Team
        </motion.h2>

        <motion.p
          className="mb-16 text-gray-300 max-w-xl mx-auto text-lg"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.7 }}
          viewport={{ once: true }}
        >
          Dreamers, builders, and innovators — together, we’re on a mission to
          make ECGenius revolutionary.
        </motion.p>

        {/* Grid with 2 cards per row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
          {teamMembers.map((member, idx) => (
            <motion.div
              key={member.name}
              className="group relative bg-black/80 rounded-xl border border-cyan-400/30 shadow-md hover:shadow-cyan-500/30 hover:border-cyan-400 transition-all duration-300 p-7 flex flex-col items-center text-center"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.15, duration: 0.6 }}
              viewport={{ once: true }}
            >
              {/* LinkedIn icon at top-right */}
              <a
                href={member.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute top-4 right-4 text-gray-400 hover:text-cyan-400 transition-colors"
                aria-label={`${member.name} LinkedIn`}
              >
                <Linkedin size={20} />
              </a>

              <h3 className="text-lg font-semibold text-white mb-1">
                {member.name}
              </h3>
              <span className="mb-3 inline-block text-xs uppercase font-bold bg-gradient-to-r from-cyan-400 to-blue-500 text-black px-3 py-1 rounded-md shadow">
                {member.role}
              </span>
              <p className="text-sm text-gray-300 leading-snug">
                {member.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TeamSection;