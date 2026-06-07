// Local-only persistence for the dynamic clinical-context wizard.
// Submission is intentionally NOT sent to a backend (none exists for this
// feature yet) — it is stored under its own localStorage namespace so it
// never collides with the existing 'ecg:questionnaire:draft:' keys used by
// HistoryQuestionnairePage.

import type { TopPrediction } from '../types/ecg';
import type { QuestionnaireDefinition, QuestionnaireResponse } from '../types/clinicalContext';
import type { OntologyInputPayload } from '../types/ontologyInput';
import { generateQuestionnaire } from '../utils/questionnaireEngine';

const DRAFT_KEY_PREFIX = 'ecg:clinicalContext:draft:';
const SUBMITTED_KEY_PREFIX = 'ecg:clinicalContext:submitted:';

export function getQuestionnaire(topRhythms: TopPrediction[]): QuestionnaireDefinition {
  return generateQuestionnaire(topRhythms);
}

export function saveDraft(response: QuestionnaireResponse): void {
  try {
    localStorage.setItem(`${DRAFT_KEY_PREFIX}${response.analysisId}`, JSON.stringify(response));
  } catch {
    // quota exceeded — ignore silently
  }
}

export function loadDraft(analysisId: string): QuestionnaireResponse | null {
  try {
    const raw = localStorage.getItem(`${DRAFT_KEY_PREFIX}${analysisId}`);
    return raw ? (JSON.parse(raw) as QuestionnaireResponse) : null;
  } catch {
    return null;
  }
}

export function clearDraft(analysisId: string): void {
  localStorage.removeItem(`${DRAFT_KEY_PREFIX}${analysisId}`);
}

export async function submitClinicalContext(payload: OntologyInputPayload): Promise<void> {
  try {
    localStorage.setItem(
      `${SUBMITTED_KEY_PREFIX}${payload.analysisId}`,
      JSON.stringify({ ...payload, submittedAt: new Date().toISOString() })
    );
  } catch {
    // quota exceeded — ignore silently
  }
}

export function hasClinicalContext(analysisId: string): boolean {
  return localStorage.getItem(`${SUBMITTED_KEY_PREFIX}${analysisId}`) !== null;
}
