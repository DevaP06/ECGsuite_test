import React from "react";
import cardiologistImg from "../assets/cardiologist.png";
import heatmapImg from "../assets/heatmap.png";
import diagnosisImg from "../assets/diagnosis.png";
import measurementsImg from "../assets/measurements.png";
import explainabilityImg from "../assets/explainability.png";

type FeatureCardProps = {
  title: string;
  description: string;
  imgAlt: string;
  imgSrc: string;
};

const FeatureCard: React.FC<FeatureCardProps> = ({ title, description, imgAlt, imgSrc }) => {
  return (
    <div className="bg-gray-900 rounded-2xl shadow-md p-6 flex flex-col hover:shadow-lg transition">
      {/* Render the image */}
      <img
        src={imgSrc}
        alt={imgAlt}
        className="w-full h-40 object-contain rounded-lg mb-4"
      />

      {/* Title */}
      <h3 className="text-lg font-bold text-white mb-2">{title}</h3>

      {/* Description */}
      <p className="text-gray-400 text-sm flex-1">{description}</p>

      {/* Learn More */}
      <a
        href="#"
        className="mt-4 inline-block text-blue-500 font-medium hover:underline"
      >
        Learn more →
      </a>
    </div>
  );
};

const ECGFeatures: React.FC = () => {
  return (
    <section className="bg-[#101626] py-16 px-6">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-extrabold text-center text-white mb-12">
          Advanced <span className="text-blue-500">ECG AI Features</span>
        </h2>

        <div className="grid md:grid-cols-3 gap-8">
          <FeatureCard
            title="Cardiologist-Guided Insights"
            description="Registered cardiologists can review, validate, and refine AI-detected patterns, ensuring higher accuracy and clinical trust."
            imgAlt="cardiologists"
            imgSrc={cardiologistImg}
          />

          <FeatureCard
            title="AI Explainability Heatmaps"
            description="See why the AI flagged a result with lead-by-lead heatmaps, showing exactly which ECG features influenced the diagnosis."
            imgAlt="Heatmaps"
            imgSrc={heatmapImg}
          />

          <FeatureCard
            title="Differential Diagnosis"
            description="AI-driven suggestions for overlapping ECG findings, guiding clinicians through multiple possible conditions for better accuracy."
            imgAlt="Differential Diagnosis"
            imgSrc={diagnosisImg}
          />

          <FeatureCard
            title="12 ECG Measurements"
            description="Instantly analyze heart rate, axis, P wave, PR, QRS, and QT/QTc intervals with automated precision."
            imgAlt="12 Measurements"
            imgSrc={measurementsImg}
          />

          <FeatureCard
            title="Advanced Explainability Tools"
            description="Includes anomaly detection, confidence scoring, and feature attribution — making AI interpretation more transparent."
            imgAlt="Explainable Functions"
            imgSrc={explainabilityImg}
          />
        </div>
      </div>
    </section>
  );
};

export default ECGFeatures;
