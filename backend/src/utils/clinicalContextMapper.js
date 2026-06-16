// Converts the frontend clinical-context wizard payload into the shape the
// ECGenius-Ontology-layer /diagnose endpoint expects.
//
// The wizard (frontend src/types/clinicalContext.ts) collects three boolean
// maps whose keys are already the ontology's evidence vocabulary:
//   symptoms     → chest_pain, dyspnea, syncope, palpitations, ...
//   riskFactors  → cad, dm, smoking, htn, prior_mi, young_age
//   vitals       → PRE-DERIVED flags: hr_gt_100, sbp_lt_90, spo2_lt_94, ...
//
// The ontology's Naive-Bayes fusion consumes a single flat { feature: bool }
// evidence dict, while its rule engine / history encoder read the structured
// `patient` ({ symptoms, risk_factors, vitals }). We supply both:
//   - patient: structured (vitals left empty — the wizard sends derived flags,
//     not raw numbers, so they belong in patient_evidence instead)
//   - patientEvidence: flat merge of all three maps (only `true` flags kept)

const onlyTrue = (obj) => {
  const out = {};
  for (const [k, v] of Object.entries(obj || {})) {
    if (v === true) out[k] = true;
  }
  return out;
};

export const toOntologyPatient = (clinicalContext) => {
  const symptoms = onlyTrue(clinicalContext?.symptoms);
  const riskFactors = onlyTrue(clinicalContext?.riskFactors);
  const vitals = onlyTrue(clinicalContext?.vitals);

  const patient = {
    symptoms,
    risk_factors: riskFactors, // ontology uses snake_case
    vitals: {},                // raw numeric vitals not collected by the wizard
  };

  const patientEvidence = { ...symptoms, ...riskFactors, ...vitals };

  return { patient, patientEvidence };
};
