import React from "react";
import careersHero from "../assets/careers-hero.png"; // ✅ replace with your provided image

const CareersHero: React.FC = () => {
  return (
    <section className="relative bg-black text-white">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={careersHero}
          alt="Careers at ECGenius"
          className="w-full h-full object-cover opacity-60" 
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-black/20" /> 
      </div>

      {/* Content */}
      <div className="relative max-w-6xl mx-auto px-6 py-32 text-center flex flex-col items-center">
        <h1 className="text-5xl md:text-6xl font-extrabold mb-8 leading-tight">
          Join Our Mission to <br /> Revolutionize Cardiac Care
        </h1>
        <p className="text-xl md:text-2xl text-gray-200 max-w-3xl">
          At <span className="text-blue-400 font-semibold">ECGenius</span>, we're pioneering 
          the future of heart health through innovative technology and a 
          passionate team. Be part of a mission that makes a real difference.
        </p>
      </div>
    </section>
  );
};

export default CareersHero;
