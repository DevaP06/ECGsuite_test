import React from "react";
import { motion } from "framer-motion";

const TeamSection = () => {
  const teamMembers = [
    {
      name: "Shekhar Deshmukh",
      role: "Co-Founder",
      description:
        "As a passionate innovator, Shekhar leads with vision and a commitment to excellence, inspiring the team to new heights.",
    },
    {
      name: "Dhruv Pekhale",
      role: "Co-Founder",
      description:
        "Dhruv brings creativity and strategic thinking to every challenge, making every project a success.",
    },
    {
      name: "Karmanya Belsare",
      role: "Co-Founder",
      description:
        "Karmanya’s technical expertise and dedication fuel our innovative solutions and seamless user experiences.",
    },
    {
      name: "Yash Ghule",
      role: "Co-Founder",
      description:
        "Yash’s energy and enthusiasm empower the whole team, fostering a collaborative and fun working environment.",
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
          Dreamers, builders, and innovators — together, we’re on a mission to make ECGenius revolutionary.
        </motion.p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {teamMembers.map((member, idx) => (
            <motion.div
              key={member.name}
              className="group bg-black/80 rounded-2xl border border-cyan-400/20 shadow-md hover:shadow-cyan-500/20 hover:border-cyan-400 transition-all duration-300 p-7 flex flex-col items-center"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.15, duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h3 className="text-xl font-semibold text-white mb-1">
                {member.name}
              </h3>
              <span className="mb-3 inline-block text-xs uppercase font-bold bg-gradient-to-r from-cyan-400 to-blue-500 text-black px-4 py-1 rounded-full shadow">
                {member.role}
              </span>
              <p className="text-sm text-gray-300 text-center">{member.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TeamSection;
