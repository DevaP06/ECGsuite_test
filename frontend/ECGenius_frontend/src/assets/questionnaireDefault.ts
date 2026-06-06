// TEMPORARY UNTIL BACKEND QUESTION ENGINE IS AVAILABLE
// This file is used as a fallback when GET /api/questionnaire/:analysisId is unavailable.
// The backend should return questions tailored to the specific ECG finding.
// Source of truth for question structure: history.json (same data, typed here for TS safety).

import type { QuestionGroup } from '../types/questionnaire';

export const DEFAULT_QUESTIONNAIRE_SECTIONS: QuestionGroup[] = [
  {
    id: 'symptoms',
    label: 'Presenting Symptoms',
    description: 'Current symptoms the patient is experiencing',
    questions: [
      { id: 'chestPain', type: 'boolean', label: 'Chest pain or pressure?', required: true, section: 'symptoms' },
      {
        id: 'chestPainOnset', type: 'single_select', label: 'Duration of chest pain',
        section: 'symptoms', showIf: { field: 'chestPain', equals: true },
        options: [
          { value: '<30min', label: '< 30 minutes' },
          { value: '30min-2hr', label: '30 minutes – 2 hours' },
          { value: '>2hr', label: '> 2 hours' },
        ],
      },
      {
        id: 'chestPainCharacter', type: 'single_select', label: 'Character of the chest pain',
        section: 'symptoms', showIf: { field: 'chestPain', equals: true },
        options: [
          { value: 'sharp', label: 'Sharp / stabbing' },
          { value: 'pressure', label: 'Pressure / squeezing' },
          { value: 'burning', label: 'Burning' },
          { value: 'dull', label: 'Dull ache' },
          { value: 'tearing', label: 'Tearing / ripping' },
        ],
      },
      {
        id: 'chestPainRadiation', type: 'multi_select', label: 'Does the pain radiate anywhere?',
        section: 'symptoms', showIf: { field: 'chestPain', equals: true },
        options: [
          { value: 'left_arm', label: 'Left arm' },
          { value: 'jaw', label: 'Jaw / neck' },
          { value: 'back', label: 'Back' },
          { value: 'shoulder', label: 'Shoulder' },
          { value: 'none', label: 'No radiation' },
        ],
      },
      { id: 'dyspnoea', type: 'boolean', label: 'Shortness of breath (dyspnoea)?', required: true, section: 'symptoms' },
      { id: 'dyspnoeaOnExertion', type: 'boolean', label: 'Shortness of breath worse on exertion?', section: 'symptoms', showIf: { field: 'dyspnoea', equals: true } },
      { id: 'palpitations', type: 'boolean', label: 'Palpitations or awareness of irregular heartbeat?', required: true, section: 'symptoms' },
      { id: 'syncope', type: 'boolean', label: 'Fainting or near-fainting (syncope / pre-syncope)?', required: true, section: 'symptoms' },
      { id: 'dizziness', type: 'boolean', label: 'Dizziness or lightheadedness?', section: 'symptoms' },
      { id: 'oedema', type: 'boolean', label: 'Swelling in legs or ankles (oedema)?', section: 'symptoms' },
      { id: 'diaphoresis', type: 'boolean', label: 'Profuse sweating (diaphoresis)?', section: 'symptoms' },
      { id: 'nausea', type: 'boolean', label: 'Nausea or vomiting?', section: 'symptoms' },
      { id: 'symptomOnset', type: 'date', label: 'When did the symptoms begin?', section: 'symptoms' },
      { id: 'symptomDescription', type: 'textarea', label: 'Additional symptom details', placeholder: 'Describe any other symptoms or relevant context…', section: 'symptoms' },
    ],
  },

  {
    id: 'medicalHistory',
    label: 'Medical History',
    description: 'Past and current medical conditions',
    questions: [
      { id: 'hypertension', type: 'boolean', label: 'Hypertension (high blood pressure)?', required: true, section: 'medicalHistory' },
      { id: 'diabetes', type: 'boolean', label: 'Diabetes mellitus?', required: true, section: 'medicalHistory' },
      {
        id: 'diabetesType', type: 'single_select', label: 'Type of diabetes',
        section: 'medicalHistory', showIf: { field: 'diabetes', equals: true },
        options: [
          { value: 'type1', label: 'Type 1' },
          { value: 'type2', label: 'Type 2' },
          { value: 'gestational', label: 'Gestational' },
          { value: 'other', label: 'Other' },
        ],
      },
      { id: 'coronaryArteryDisease', type: 'boolean', label: 'Known coronary artery disease (CAD)?', required: true, section: 'medicalHistory' },
      { id: 'previousMI', type: 'boolean', label: 'Previous myocardial infarction (heart attack)?', section: 'medicalHistory' },
      { id: 'miDate', type: 'date', label: 'Approximate date of heart attack', section: 'medicalHistory', showIf: { field: 'previousMI', equals: true } },
      { id: 'heartFailure', type: 'boolean', label: 'Heart failure?', section: 'medicalHistory' },
      { id: 'atrialFibrillation', type: 'boolean', label: 'Previous atrial fibrillation (AF / AFib)?', section: 'medicalHistory' },
      { id: 'stroke', type: 'boolean', label: 'Previous stroke or TIA (mini-stroke)?', section: 'medicalHistory' },
      { id: 'kidneyDisease', type: 'boolean', label: 'Chronic kidney disease (CKD)?', section: 'medicalHistory' },
      { id: 'thyroidDisease', type: 'boolean', label: 'Thyroid disease (hypo / hyperthyroidism)?', section: 'medicalHistory' },
      { id: 'sleepApnoea', type: 'boolean', label: 'Obstructive sleep apnoea?', section: 'medicalHistory' },
      { id: 'previousCardiacProcedure', type: 'boolean', label: 'Previous cardiac procedure (stent, bypass, pacemaker, ablation)?', section: 'medicalHistory' },
      { id: 'procedureDetails', type: 'textarea', label: 'Procedure details', placeholder: 'List procedures with approximate dates…', section: 'medicalHistory', showIf: { field: 'previousCardiacProcedure', equals: true } },
    ],
  },

  {
    id: 'riskFactors',
    label: 'Risk Factors',
    description: 'Cardiovascular risk factors',
    questions: [
      { id: 'tobaccoUse', type: 'boolean', label: 'Current or past tobacco use?', required: true, section: 'riskFactors' },
      {
        id: 'smokingStatus', type: 'single_select', label: 'Smoking status',
        section: 'riskFactors', showIf: { field: 'tobaccoUse', equals: true },
        options: [
          { value: 'current', label: 'Current smoker' },
          { value: 'former', label: 'Former smoker (quit > 1 year ago)' },
          { value: 'other_tobacco', label: 'Other tobacco (pipe, chew, e-cig)' },
        ],
      },
      { id: 'packYears', type: 'number', label: 'Pack years (packs/day × years smoked)', section: 'riskFactors', showIf: { field: 'tobaccoUse', equals: true }, min: 0, max: 300 },
      { id: 'alcoholUse', type: 'boolean', label: 'Regular alcohol consumption?', section: 'riskFactors' },
      { id: 'alcoholUnitsPerWeek', type: 'number', label: 'Alcohol units per week', section: 'riskFactors', showIf: { field: 'alcoholUse', equals: true }, min: 0, max: 200, unit: 'units/week' },
      { id: 'highCholesterol', type: 'boolean', label: 'High cholesterol (dyslipidaemia)?', required: true, section: 'riskFactors' },
      { id: 'obesity', type: 'boolean', label: 'Obesity (BMI ≥ 30)?', section: 'riskFactors' },
      { id: 'bmi', type: 'number', label: 'Current BMI (if known)', section: 'riskFactors', min: 10, max: 80, unit: 'kg/m²' },
      { id: 'sedentaryLifestyle', type: 'boolean', label: 'Sedentary lifestyle (< 30 min exercise per week)?', section: 'riskFactors' },
      { id: 'chronicStress', type: 'boolean', label: 'Chronic psychological stress?', section: 'riskFactors' },
    ],
  },

  {
    id: 'lifestyle',
    label: 'Lifestyle',
    description: 'Daily habits that may influence cardiac health',
    questions: [
      {
        id: 'exerciseFrequency', type: 'single_select', label: 'Exercise frequency',
        section: 'lifestyle',
        options: [
          { value: 'none', label: 'None' },
          { value: '1-2pw', label: '1–2 times per week' },
          { value: '3-4pw', label: '3–4 times per week' },
          { value: '5plus', label: '5+ times per week' },
        ],
      },
      {
        id: 'exerciseType', type: 'multi_select', label: 'Types of exercise (select all that apply)',
        section: 'lifestyle',
        options: [
          { value: 'walking', label: 'Walking' },
          { value: 'running', label: 'Running / jogging' },
          { value: 'cycling', label: 'Cycling' },
          { value: 'swimming', label: 'Swimming' },
          { value: 'gym', label: 'Gym / weight training' },
          { value: 'yoga', label: 'Yoga / stretching' },
          { value: 'other', label: 'Other' },
        ],
      },
      {
        id: 'dietQuality', type: 'single_select', label: 'Self-assessed diet quality',
        section: 'lifestyle',
        options: [
          { value: 'healthy', label: 'Healthy (low sodium, low saturated fat)' },
          { value: 'moderate', label: 'Moderate' },
          { value: 'poor', label: 'Poor (high sodium, processed / fast food)' },
        ],
      },
      { id: 'sleepHours', type: 'number', label: 'Average sleep hours per night', section: 'lifestyle', min: 0, max: 24, unit: 'hrs' },
      {
        id: 'caffeineIntake', type: 'single_select', label: 'Daily caffeine intake',
        section: 'lifestyle',
        options: [
          { value: 'none', label: 'None' },
          { value: '1-2', label: '1–2 cups / day' },
          { value: '3-5', label: '3–5 cups / day' },
          { value: '6plus', label: '6+ cups / day' },
        ],
      },
      { id: 'occupationalStress', type: 'boolean', label: 'High-stress occupation?', section: 'lifestyle' },
      { id: 'recentMajorStressor', type: 'boolean', label: 'Recent major life stressor (past 3 months)?', section: 'lifestyle' },
    ],
  },

  {
    id: 'medications',
    label: 'Current Medications',
    description: 'Medications currently being taken',
    questions: [
      { id: 'takingMedications', type: 'boolean', label: 'Currently taking any medications?', required: true, section: 'medications' },
      { id: 'medicationList', type: 'textarea', label: 'List all current medications (name, dose, frequency)', placeholder: 'e.g. Aspirin 75 mg once daily, Atorvastatin 40 mg at night…', section: 'medications', showIf: { field: 'takingMedications', equals: true } },
      { id: 'anticoagulants', type: 'boolean', label: 'On anticoagulants (warfarin, rivaroxaban, apixaban, dabigatran)?', section: 'medications', showIf: { field: 'takingMedications', equals: true } },
      { id: 'antiarrhythmics', type: 'boolean', label: 'On antiarrhythmic drugs (amiodarone, flecainide, sotalol)?', section: 'medications', showIf: { field: 'takingMedications', equals: true } },
      { id: 'betaBlockers', type: 'boolean', label: 'On beta-blockers (metoprolol, bisoprolol, atenolol)?', section: 'medications', showIf: { field: 'takingMedications', equals: true } },
      { id: 'qtProlongingDrugs', type: 'boolean', label: 'On QT-prolonging drugs (clarithromycin, haloperidol, ondansetron)?', section: 'medications', hint: 'These drugs can prolong the QT interval and may be clinically significant.', showIf: { field: 'takingMedications', equals: true } },
      { id: 'drugAllergies', type: 'textarea', label: 'Known drug allergies or adverse reactions', placeholder: 'List any drug allergies or intolerances…', section: 'medications' },
    ],
  },

  {
    id: 'familyHistory',
    label: 'Family History',
    description: 'Cardiac conditions in first-degree relatives (parents, siblings, children)',
    questions: [
      { id: 'familyHeartDisease', type: 'boolean', label: 'Family history of heart disease?', required: true, section: 'familyHistory' },
      { id: 'familyHeartDiseaseAge', type: 'number', label: 'Age of first-degree relative at cardiac event', section: 'familyHistory', showIf: { field: 'familyHeartDisease', equals: true }, min: 1, max: 120, unit: 'years', hint: 'Premature disease is defined as < 55 in males or < 65 in females.' },
      { id: 'familySuddenCardiacDeath', type: 'boolean', label: 'Sudden cardiac death in the family?', section: 'familyHistory' },
      { id: 'familySCDAge', type: 'number', label: 'Age at sudden cardiac death', section: 'familyHistory', showIf: { field: 'familySuddenCardiacDeath', equals: true }, min: 1, max: 120, unit: 'years' },
      { id: 'familyArrhythmia', type: 'boolean', label: 'Family history of arrhythmia or cardiomyopathy?', section: 'familyHistory' },
      { id: 'familyCongenitalHeart', type: 'boolean', label: 'Family history of congenital heart disease?', section: 'familyHistory' },
      { id: 'familyNotes', type: 'textarea', label: 'Additional family history notes', placeholder: 'Any other relevant family history…', section: 'familyHistory' },
    ],
  },
];
