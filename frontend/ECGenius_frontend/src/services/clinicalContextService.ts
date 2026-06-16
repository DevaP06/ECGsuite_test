// Clinical-context wizard persistence.
// Drafts are kept in localStorage under their own 'ecg:clinicalContext:' namespace.
// On submit we POST the context to the backend (which re-runs the ontology with
// the patient evidence and persists the refined differential) AND mirror it to
// localStorage so the dashboard can render the submitted context offline.

import AxiosInstance from '../AxiosInstance';
import type { TopPrediction } from '../types/ecg';
import type { ClinicalContext, QuestionnaireDefinition, QuestionnaireResponse } from '../types/clinicalContext';
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
  // Send to the backend first — it re-runs the ontology with the patient
  // evidence and persists the refined differential onto the analysis. If this
  // throws, the caller surfaces the error and the user can retry.
  await AxiosInstance.post(`/api/clinical-context/${payload.analysisId}`, {
    clinicalContext: payload.clinicalContext,
    topRhythms: payload.topRhythms,
  });

  // Mirror to localStorage so the dashboard can render the submitted context
  // (and its "completed" badge) without an extra round-trip.
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

export function getSubmittedAt(analysisId: string): string | null {
  try {
    const raw = localStorage.getItem(`${SUBMITTED_KEY_PREFIX}${analysisId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { submittedAt?: string };
    return parsed.submittedAt ?? null;
  } catch {
    return null;
  }
}

export function getSubmittedClinicalContext(analysisId: string): ClinicalContext | null {
  try {
    const raw = localStorage.getItem(`${SUBMITTED_KEY_PREFIX}${analysisId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { clinicalContext?: ClinicalContext };
    return parsed.clinicalContext ?? null;
  } catch {
    return null;
  }
}
