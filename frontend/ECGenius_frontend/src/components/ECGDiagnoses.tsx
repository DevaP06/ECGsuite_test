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
  features: string;
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
      { name: "Sinus Tachycardia", features: "Elevated HR >100 bpm, normal P-QRS-T morphology." },
      { name: "Sinus Bradycardia", features: "HR <60 bpm, normal P-QRS-T morphology." },
      { name: "Atrial Fibrillation (AFib)", features: "Irregular rhythm, absent P-waves, variable RR." },
      { name: "Atrial Flutter", features: "Sawtooth flutter waves, regular atrial rhythm." },
      { name: "Supraventricular Tachycardia (SVT)", features: "Rapid narrow QRS, absent P-waves, sudden onset." },
      { name: "Ventricular Tachycardia (VT)", features: "Wide QRS, rapid rate, AV dissociation." },
      { name: "Ventricular Fibrillation (VF)", features: "Chaotic, no identifiable QRS/P/T." },
      { name: "Junctional Rhythm", features: "Inverted/absent P, normal QRS, regular rhythm." },
      { name: "PAC", features: "Early abnormal P-wave, normal QRS." },
      { name: "PVC", features: "Early wide bizarre QRS, compensatory pause." },
      { name: "PSVT", features: "Sudden onset, narrow QRS, absent P." },
      { name: "Torsades de Pointes", features: "Polymorphic VT, twisting QRS around baseline." },
      { name: "Sinus Arrest", features: "Sudden pause of sinus activity, escape rhythm follows." },
      { name: "Sick Sinus Syndrome", features: "Alternating brady/tachycardia, sinus pauses." },
      { name: "WPW Syndrome", features: "Short PR, delta wave, wide QRS." },
    ],
  },
  {
    category: "Conduction Disorders",
    icon: <FaBolt className="text-blue-400 mr-2" />,
    items: [
      { name: "First-Degree AV Block", features: "PR >300 ms, constant." },
      { name: "Second-Degree AV Block (Mobitz I)", features: "Progressive PR lengthening, dropped QRS." },
      { name: "Second-Degree AV Block (Mobitz II)", features: "Constant PR, intermittent dropped QRS." },
      { name: "Third-Degree AV Block", features: "No relation P/QRS, atria & ventricles independent." },
      { name: "LBBB", features: "Wide QRS, broad R in I, V5-V6." },
      { name: "RBBB", features: "RSR' (bunny ears) in V1-V3, wide S in I, V6." },
      { name: "LAFB", features: "Left axis deviation, small q in I/aVL." },
      { name: "LPFB", features: "Right axis deviation, small q in II/III/aVF." },
      { name: "Bifascicular Block", features: "RBBB + LAFB/LPFB." },
      { name: "Trifascicular Block", features: "RBBB + LAFB + LPFB." },
    ],
  },
  {
    category: "Ischemic Heart Disease",
    icon: <FaStethoscope className="text-blue-400 mr-2" />,
    items: [
      { name: "STEMI", features: "ST elevation, hyperacute T, new LBBB." },
      { name: "NSTEMI", features: "ST depression, T inversion, ↑ biomarkers." },
      { name: "Unstable Angina", features: "ST depression, T inversion, no biomarkers." },
      { name: "Old MI", features: "Pathological Q waves, poor R progression." },
      { name: "Subendocardial Ischemia", features: "ST depression, T inversion." },
      { name: "Transmural Ischemia", features: "ST elevation, reciprocal ST depression." },
      { name: "Posterior MI", features: "Tall R & ST depression in V1-V3." },
      { name: "Inferior MI", features: "ST elevation in II, III, aVF." },
      { name: "Anterior MI", features: "ST elevation in V1-V4." },
      { name: "Lateral MI", features: "ST elevation in I, aVL, V5-V6." },
    ],
  },
  {
    category: "Electrolyte & Metabolic Abnormalities",
    icon: <FaFlask className="text-blue-400 mr-2" />,
    items: [
      { name: "Hyperkalemia", features: "Tall peaked T, wide QRS, prolonged PR." },
      { name: "Hypokalemia", features: "ST depression, U-waves." },
      { name: "Hypercalcemia", features: "Short QT, wide T." },
      { name: "Hypocalcemia", features: "Prolonged QT, long ST." },
      { name: "Hypermagnesemia", features: "Prolonged PR, wide QRS, bradycardia." },
      { name: "Hypomagnesemia", features: "Prolonged QT, T inversion, U-waves." },
    ],
  },
  {
    category: "Structural Heart Disease",
    icon: <FaProcedures className="text-blue-400 mr-2" />,
    items: [
      { name: "LVH", features: "Tall R in V5-V6, deep S in V1-V2." },
      { name: "RVH", features: "Right axis deviation, tall R in V1." },
      { name: "Left Atrial Enlargement", features: "Biphasic P in V1, prolonged P duration." },
      { name: "Right Atrial Enlargement", features: "Tall P >2.5 mm in inferior leads." },
      { name: "LV Aneurysm", features: "Persistent ST elevation, deep Q waves." },
      { name: "Pericarditis", features: "Diffuse ST elevation, PR depression." },
      { name: "Hypertrophic Cardiomyopathy", features: "Deep Q in lateral leads, tall R, LAD." },
      { name: "Dilated Cardiomyopathy", features: "Low QRS, LBBB, poor R progression." },
    ],
  },
  {
    category: "Genetic & Inherited Syndromes",
    icon: <FaDna className="text-blue-400 mr-2" />,
    items: [
      { name: "Long QT Syndrome", features: "Prolonged QT, T alternans, syncope." },
      { name: "Brugada Syndrome", features: "ST elevation V1-V3, RBBB, coved ST." },
      { name: "Early Repolarization", features: "J-point elevation, concave ST." },
      { name: "Short QT Syndrome", features: "Short QT, peaked T, AFib." },
      { name: "CPVT", features: "Bidirectional VT, triggered by exercise/stress." },
    ],
  },
  {
    category: "Other Clinical Conditions",
    icon: <FaNotesMedical className="text-blue-400 mr-2" />,
    items: [
      { name: "Hypothermia", features: "Osborne J-waves, prolonged PR, bradycardia." },
      { name: "Digitalis Toxicity", features: "Scooped ST, short QT, T inversion." },
      { name: "Pulmonary Embolism", features: "S1Q3T3 pattern." },
      { name: "Acute Pericarditis", features: "Diffuse ST elevation, PR depression." },
      { name: "Myocarditis", features: "ST elevation, T inversion, low QRS." },
      { name: "Pneumothorax", features: "Axis deviation, low voltage QRS." },
      { name: "Hyperventilation", features: "Sinus tachycardia, low QRS, T inversion." },
      { name: "Anxiety", features: "Sinus tachycardia, normal ECG." },
      { name: "Artifacts", features: "Baseline wander, tremor, 60 Hz interference." },
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
                      <p className="text-sm text-gray-300 mt-1">{item.features}</p>
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
