import type { RhythmQuestionMap } from '../types/clinicalContext';

/**
 * Rhythm → clinical-history key mapping (symptoms / risk factors / vitals).
 * Single source of truth for the dynamic clinical-context questionnaire —
 * converted verbatim from the supplied history_schema.json. Never hardcode
 * rhythm-specific question sets anywhere else; always derive from this map
 * via src/utils/questionnaireEngine.ts.
 */
export const HISTORY_SCHEMA: RhythmQuestionMap = {
  STEMI: {
    symptoms: ['chest_pain', 'diaphoresis', 'dyspnea', 'syncope'],
    risk_factors: ['cad', 'dm', 'smoking', 'prior_mi'],
    vitals: ['sbp_lt_90', 'spo2_lt_94', 'hr_gt_100'],
  },
  NSTEMI: {
    symptoms: ['chest_pain', 'diaphoresis', 'dyspnea', 'syncope'],
    risk_factors: ['cad', 'dm', 'smoking', 'prior_mi', 'htn', 'young_age'],
    vitals: ['sbp_lt_90', 'hr_gt_100'],
  },
  Unstable_Angina: {
    symptoms: ['chest_pain'],
    risk_factors: ['cad', 'dm', 'smoking', 'young_age'],
    vitals: [],
  },
  AF: {
    symptoms: ['palpitations', 'dyspnea', 'syncope', 'dizziness', 'asymptomatic'],
    risk_factors: ['htn', 'dm'],
    vitals: ['hr_gt_150'],
  },
  Atrial_Flutter: {
    symptoms: ['palpitations', 'dyspnea', 'asymptomatic'],
    risk_factors: [],
    vitals: ['hr_gt_150'],
  },
  SVT: {
    symptoms: ['palpitations', 'dizziness', 'syncope', 'asymptomatic'],
    risk_factors: [],
    vitals: ['hr_gt_160'],
  },
  VT: {
    symptoms: ['palpitations', 'syncope'],
    risk_factors: ['cad', 'prior_mi'],
    vitals: ['sbp_lt_90', 'hr_gt_150'],
  },
  VF: {
    symptoms: ['syncope'],
    risk_factors: ['cad', 'prior_mi'],
    vitals: ['sbp_lt_90', 'hr_gt_200'],
  },
  Sinus_Bradycardia: {
    symptoms: ['dizziness', 'syncope', 'asymptomatic'],
    risk_factors: [],
    vitals: ['hr_lt_60'],
  },
  Sinus_Tachycardia: {
    symptoms: ['dyspnea', 'chest_pain'],
    risk_factors: [],
    vitals: ['hr_gt_100', 'spo2_lt_94'],
  },
  LBBB: {
    symptoms: ['chest_pain', 'dyspnea'],
    risk_factors: ['cad', 'prior_mi'],
    vitals: [],
  },
  RBBB: {
    symptoms: ['dyspnea', 'palpitations'],
    risk_factors: [],
    vitals: ['spo2_lt_94'],
  },
  Heart_Block_3rd: {
    symptoms: ['syncope', 'dizziness', 'dyspnea'],
    risk_factors: [],
    vitals: ['sbp_lt_90', 'hr_lt_40'],
  },
  Heart_Block_2nd_MobitzII: {
    symptoms: ['syncope', 'dizziness'],
    risk_factors: [],
    vitals: ['hr_lt_60'],
  },
  Heart_Block_2nd_MobitzI: {
    symptoms: ['dizziness', 'asymptomatic'],
    risk_factors: [],
    vitals: [],
  },
  Heart_Block_1st: {
    symptoms: ['asymptomatic'],
    risk_factors: [],
    vitals: [],
  },
  Pericarditis: {
    symptoms: ['chest_pain', 'no_chest_pain'],
    risk_factors: ['young_age'],
    vitals: [],
  },
  Long_QT: {
    symptoms: ['syncope', 'palpitations'],
    risk_factors: ['young_age'],
    vitals: [],
  },
  Brugada: {
    symptoms: ['syncope', 'palpitations'],
    risk_factors: ['young_age'],
    vitals: [],
  },
  LVH: {
    symptoms: ['dyspnea', 'dizziness'],
    risk_factors: ['htn', 'young_age'],
    vitals: ['sbp_gt_140'],
  },
  LVH_Strain: {
    symptoms: ['dyspnea'],
    risk_factors: ['htn', 'young_age'],
    vitals: ['sbp_gt_140'],
  },

  // ── Added to close the model→ontology→questionnaire coverage gap ──────────
  // Standard AHA/ACC symptom–risk–vital associations, using the existing key
  // vocabulary. CLINICAL-DECISION-SUPPORT CONTENT — pending cardiologist review
  // (same sign-off process as rules_v2.csv).
  ST_Elevation: {
    symptoms: ['chest_pain', 'diaphoresis', 'dyspnea', 'syncope'],
    risk_factors: ['cad', 'dm', 'smoking', 'prior_mi'],
    vitals: ['sbp_lt_90', 'spo2_lt_94', 'hr_gt_100'],
  },
  ST_Depression: {
    symptoms: ['chest_pain', 'diaphoresis', 'dyspnea'],
    risk_factors: ['cad', 'dm', 'smoking', 'htn', 'prior_mi'],
    vitals: ['hr_gt_100'],
  },
  TWI: {
    symptoms: ['chest_pain', 'dyspnea'],
    risk_factors: ['cad', 'htn'],
    vitals: [],
  },
  NSR: {
    symptoms: ['asymptomatic'],
    risk_factors: [],
    vitals: [],
  },
  PVC: {
    symptoms: ['palpitations', 'dizziness', 'asymptomatic'],
    risk_factors: ['cad', 'prior_mi'],
    vitals: [],
  },
  Irregular_RR: {
    symptoms: ['palpitations', 'dyspnea', 'dizziness', 'syncope'],
    risk_factors: ['htn', 'dm'],
    vitals: ['hr_gt_100'],
  },
  Short_PR: {
    symptoms: ['palpitations', 'syncope', 'dizziness'],
    risk_factors: ['young_age'],
    vitals: ['hr_gt_150'],
  },
  Wide_QRS: {
    symptoms: ['palpitations', 'syncope', 'dizziness', 'dyspnea'],
    risk_factors: ['cad', 'prior_mi'],
    vitals: ['sbp_lt_90', 'hr_gt_100'],
  },

  // ── New ontology diagnoses (RVH/RAE/PAC/Pathological_Q_Waves) — pending review ──
  RVH: {
    symptoms: ['dyspnea', 'dizziness'],
    risk_factors: [],
    vitals: ['spo2_lt_94'],
  },
  RAE: {
    symptoms: ['dyspnea'],
    risk_factors: [],
    vitals: ['spo2_lt_94'],
  },
  PAC: {
    symptoms: ['palpitations', 'asymptomatic'],
    risk_factors: [],
    vitals: [],
  },
  Pathological_Q_Waves: {
    symptoms: ['chest_pain', 'dyspnea'],
    risk_factors: ['cad', 'dm', 'smoking', 'prior_mi', 'htn'],
    vitals: [],
  },
};
