import React, { useState } from "react";
import {
  FaHeartbeat,        // Arrhythmias
  FaBolt,             // Conduction
  FaStethoscope,      // Ischemia
  FaFlask,            // Electrolytes
  FaProcedures,       // Structural
  FaDna,              // Genetic
  FaNotesMedical      // Other clinical
} from "react-icons/fa";

type DiagnosisItem = {
  name: string;
};

type DiagnosisGroup = {
  category: string;
  icon: React.ReactNode;
  items: DiagnosisItem[];
};

const diagnoses: DiagnosisGroup[] = [
  {
    category: "Rhythm Disorders (Arrhythmias)",
    icon: <FaHeartbeat className="text-blue-400 mr-2" />,
    items: [
      { name: "Sinus Tachycardia" },
      { name: "Sinus Bradycardia" },
      { name: "Atrial Fibrillation (AFib)" },
      { name: "Atrial Flutter" },
      { name: "Supraventricular Tachycardia (SVT)" },
      { name: "Ventricular Tachycardia (VT)" },
      { name: "Ventricular Fibrillation (VF)" },
      { name: "Junctional Rhythm" },
      { name: "PAC" },
      { name: "PVC" },
      { name: "PSVT" },
      { name: "Torsades de Pointes" },
      { name: "Sinus Arrest" },
      { name: "Sick Sinus Syndrome" },
      { name: "WPW Syndrome" },
    ],
  },
  {
    category: "Conduction Disorders",
    icon: <FaBolt className="text-blue-400 mr-2" />,
    items: [
      { name: "First-Degree AV Block" },
      { name: "Second-Degree AV Block (Mobitz I)" },
      { name: "Second-Degree AV Block (Mobitz II)" },
      { name: "Third-Degree AV Block" },
      { name: "LBBB" },
      { name: "RBBB" },
      { name: "LAFB" },
      { name: "LPFB" },
      { name: "Bifascicular Block" },
      { name: "Trifascicular Block" },
    ],
  },
  {
    category: "Ischemic Heart Disease",
    icon: <FaStethoscope className="text-blue-400 mr-2" />,
    items: [
      { name: "STEMI" },
      { name: "NSTEMI" },
      { name: "Unstable Angina" },
      { name: "Old MI" },
      { name: "Subendocardial Ischemia" },
      { name: "Transmural Ischemia" },
      { name: "Posterior MI" },
      { name: "Inferior MI" },
      { name: "Anterior MI" },
      { name: "Lateral MI" },
    ],
  },
  {
    category: "Electrolyte & Metabolic Abnormalities",
    icon: <FaFlask className="text-blue-400 mr-2" />,
    items: [
      { name: "Hyperkalemia" },
      { name: "Hypokalemia" },
      { name: "Hypercalcemia" },
      { name: "Hypocalcemia" },
      { name: "Hypermagnesemia" },
      { name: "Hypomagnesemia" },
    ],
  },
  {
    category: "Structural Heart Disease",
    icon: <FaProcedures className="text-blue-400 mr-2" />,
    items: [
      { name: "LVH" },
      { name: "RVH" },
      { name: "Left Atrial Enlargement" },
      { name: "Right Atrial Enlargement" },
      { name: "LV Aneurysm" },
      { name: "Pericarditis" },
      { name: "Hypertrophic Cardiomyopathy" },
      { name: "Dilated Cardiomyopathy" },
    ],
  },
  {
    category: "Genetic & Inherited Syndromes",
    icon: <FaDna className="text-blue-400 mr-2" />,
    items: [
      { name: "Long QT Syndrome" },
      { name: "Brugada Syndrome" },
      { name: "Early Repolarization" },
      { name: "Short QT Syndrome" },
      { name: "CPVT" },
    ],
  },
  {
    category: "Other Clinical Conditions",
    icon: <FaNotesMedical className="text-blue-400 mr-2" />,
    items: [
      { name: "Hypothermia" },
      { name: "Digitalis Toxicity" },
      { name: "Pulmonary Embolism" },
      { name: "Acute Pericarditis" },
      { name: "Myocarditis" },
      { name: "Pneumothorax" },
      { name: "Hyperventilation" },
      { name: "Anxiety" },
      { name: "Artifacts" },
    ],
  },
];

const ECGDiagnoses: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const toggle = (index: number) => setOpenIndex(openIndex === index ? null : index);

  return (
    <section className="bg-[#101626] text-white py-12 px-6 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl font-extrabold mb-10 text-center tracking-wide">
          <span className="text-blue-400">ECG</span> Supported Diagnoses
        </h2>

        <div className="space-y-5">
          {diagnoses.map((group, idx) => (
            <div
              key={idx}
              className="border border-blue-700/50 rounded-lg overflow-hidden shadow-md transition-all hover:shadow-blue-500/30"
            >
              <button
                onClick={() => toggle(idx)}
                className="w-full flex justify-between items-center px-5 py-4
                   bg-[#12233b] hover:bg-[#173052] transition-colors duration-200"
              >
                <span className="flex items-center text-lg font-semibold text-blue-300">
                  {group.icon} {group.category}
                </span>
                <span className="text-blue-400 text-2xl font-bold">
                  {openIndex === idx ? "−" : "+"}
                </span>
              </button>

              {openIndex === idx && (
                <div className="px-5 py-4 bg-[#192d4d] space-y-3 transition-all duration-300 ease-in-out">
                  {group.items.map((item, i) => (
                    <div
                      key={i}
                      className="border-b border-blue-700/30 pb-2 last:border-none"
                    >
                      <p className="font-semibold text-blue-300">{item.name}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ECGDiagnoses;
