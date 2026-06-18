/**
 * Model acronym → ontology label_id translation.
 * Mirrors backend/ml/label_mapping.json (the single source of truth, also used
 * by ml_api.py's _run_ontology()). Keep these two files in sync.
 *
 * `topPredictions[].rhythm` from the backend carries the model's raw class
 * acronyms (e.g. "AFIB", "SB", "1AVB"), but HISTORY_SCHEMA (historySchema.ts)
 * is keyed by the ontology vocabulary (e.g. "AF", "Sinus_Bradycardia",
 * "Heart_Block_1st"). Translate through this map before any HISTORY_SCHEMA
 * lookup. Acronyms with no reasonable ontology counterpart are intentionally
 * omitted — callers should fall back to the original rhythm string.
 */
export const MODEL_LABEL_TO_ONTOLOGY: Record<string, string> = {
  AFIB: 'AF',
  AF: 'Atrial_Flutter',

  LVH: 'LVH',
  RBBB: 'RBBB',
  SB: 'Sinus_Bradycardia',
  SR: 'NSR',
  ST: 'Sinus_Tachycardia',
  VPB: 'PVC',
  '1AVB': 'Heart_Block_1st',
  '2AVB1': 'Heart_Block_2nd_MobitzI',
  '3AVB': 'Heart_Block_3rd',
  QTIE: 'Long_QT',
  STDD: 'ST_Depression',
  STE: 'ST_Elevation',
  SVT: 'SVT',
  TWO: 'TWI',

  LFBBB: 'LBBB',
  TWC: 'TWI',
  PRIE: 'Heart_Block_1st',
  SA: 'Irregular_RR',
  VPE: 'Short_PR',
  WPW: 'Short_PR',

  // Added to widen questionnaire coverage (clinically unambiguous mappings only):
  AT: 'SVT',          // atrial tachycardia → supraventricular tachycardia
  AVRT: 'SVT',        // AV reentrant tachycardia → supraventricular tachycardia
  IVB: 'Wide_QRS',    // intraventricular block → wide-QRS conduction
  STTC: 'ST_Depression', // ST-T change → repolarization abnormality (review)

  // New ontology diagnoses added (labels.csv) — pending cardiologist review:
  RVH: 'RVH',                    // right ventricular hypertrophy
  RAH: 'RAE',                    // right atrial hypertrophy → right atrial enlargement
  APB: 'PAC',                    // atrial premature beats → premature atrial complex
  AQW: 'Pathological_Q_Waves',   // abnormal Q wave → pathological Q waves (prior MI)
  MISW: 'Pathological_Q_Waves',  // side-wall MI → pathological Q waves (review acuity)
};

export function toOntologyLabel(rhythm: string): string {
  return MODEL_LABEL_TO_ONTOLOGY[rhythm] ?? rhythm;
}
