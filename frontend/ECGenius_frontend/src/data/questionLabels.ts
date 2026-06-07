/**
 * Maps internal history-schema keys to human-readable question text.
 * No raw keys are ever shown in the UI — every key surfaced by
 * src/data/historySchema.ts must have an entry here.
 */
export const QUESTION_LABELS: Record<string, string> = {
  // Symptoms
  chest_pain: 'Are you currently experiencing chest pain or pressure?',
  no_chest_pain: 'Are you free of chest pain or chest discomfort?',
  diaphoresis: 'Have you been sweating more than usual, especially with discomfort?',
  dyspnea: 'Do you feel short of breath, even at rest or with mild activity?',
  syncope: 'Have you fainted or felt like you were about to lose consciousness?',
  palpitations: 'Do you feel your heart racing, fluttering, or skipping beats?',
  dizziness: 'Have you felt dizzy or light-headed recently?',
  asymptomatic: 'Are you currently free of any noticeable symptoms?',

  // Risk factors
  cad: 'Do you have a history of coronary artery disease?',
  dm: 'Do you have diabetes mellitus?',
  smoking: 'Do you currently smoke or have a history of smoking?',
  prior_mi: 'Has a doctor previously diagnosed you with a heart attack (myocardial infarction)?',
  htn: 'Do you have a history of high blood pressure (hypertension)?',
  young_age: 'Are you under 40 years of age?',

  // Vitals
  sbp_lt_90: 'Is your systolic blood pressure below 90 mmHg?',
  sbp_gt_140: 'Is your systolic blood pressure above 140 mmHg?',
  spo2_lt_94: 'Is your oxygen saturation (SpO₂) below 94%?',
  hr_gt_100: 'Is your heart rate above 100 beats per minute?',
  hr_gt_150: 'Is your heart rate above 150 beats per minute?',
  hr_gt_160: 'Is your heart rate above 160 beats per minute?',
  hr_gt_200: 'Is your heart rate above 200 beats per minute?',
  hr_lt_60: 'Is your heart rate below 60 beats per minute?',
  hr_lt_40: 'Is your heart rate below 40 beats per minute?',
};

export function getQuestionLabel(key: string): string {
  return QUESTION_LABELS[key] ?? key;
}
