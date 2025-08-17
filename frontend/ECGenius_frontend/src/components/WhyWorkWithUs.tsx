import React from "react";

const benefits = [
  {
    title: "Growth Opportunities",
    desc: "We invest in your professional development with continuous learning and career advancement programs.",
    icon: "🌱",
  },
  {
    title: "Impact-Driven Mission",
    desc: "Be part of a team dedicated to improving lives through groundbreaking advancements in cardiac care.",
    icon: "💙",
  },
  {
    title: "Flexible Culture",
    desc: "Enjoy a work-life balance with flexible hours and remote work options that support your well-being.",
    icon: "🕒",
  },
  {
    title: "Cutting-Edge Tech",
    desc: "Work with the latest technologies and contribute to innovative solutions that are shaping the future of healthcare.",
    icon: "⚡",
  },
];

const WhyWorkWithUs: React.FC = () => {
  return (
    <section className="bg-black text-white py-20 relative">
      <div className="max-w-7xl mx-auto px-6">
        {/* Heading */}
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
          Why <span className="text-blue-400">Work With Us</span>
        </h2>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {benefits.map((item, idx) => (
            <div
              key={idx}
              className="bg-gradient-to-b from-gray-900 to-gray-800 rounded-2xl p-6 shadow-lg border border-gray-800 
                         hover:border-blue-500 hover:shadow-blue-500/30 
                         transition-all duration-300 transform hover:-translate-y-2"
            >
              {/* Icon */}
              <div className="text-5xl mb-4 text-blue-400">{item.icon}</div>

              {/* Title */}
              <h3 className="text-xl font-semibold mb-3 text-blue-300">
                {item.title}
              </h3>

              {/* Description */}
              <p className="text-gray-300 text-sm leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Subtle Blue Glow Background Accent */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="w-[400px] h-[400px] bg-blue-500/20 blur-3xl rounded-full absolute -top-20 -left-20"></div>
        <div className="w-[300px] h-[300px] bg-blue-400/10 blur-3xl rounded-full absolute bottom-10 right-10"></div>
      </div>
    </section>
  );
};

export default WhyWorkWithUs;
