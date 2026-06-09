import AxiosInstance from '../AxiosInstance';
import {
  isQuestionVisible,
  isValueEmpty,
  type Question,
  type QuestionGroup,
  type QuestionnaireResponse,
  type QuestionnaireSubmitPayload,
  type QuestionnaireDraft,
  type QuestionValue,
} from '../types/questionnaire';

const DRAFT_KEY_PREFIX = 'ecg:questionnaire:draft:';

// ─── Fetch questionnaire schema ───────────────────────────────────────────────
export async function fetchQuestionnaire(analysisId: string): Promise<QuestionnaireResponse> {
  const res = await AxiosInstance.get<QuestionnaireResponse>(
    `/api/questionnaire/${analysisId}`
  );
  return res.data;
}

// ─── Submit completed questionnaire ──────────────────────────────────────────
export async function submitQuestionnaire(
  analysisId: string,
  payload: QuestionnaireSubmitPayload
): Promise<void> {
  await AxiosInstance.post(`/api/questionnaire/${analysisId}`, payload);
}

// ─── Draft persistence (localStorage) ────────────────────────────────────────
export function saveDraft(draft: QuestionnaireDraft): void {
  try {
    localStorage.setItem(`${DRAFT_KEY_PREFIX}${draft.analysisId}`, JSON.stringify(draft));
  } catch {
    // quota exceeded — ignore silently
  }
}

export function loadDraft(analysisId: string): QuestionnaireDraft | null {
  try {
    const raw = localStorage.getItem(`${DRAFT_KEY_PREFIX}${analysisId}`);
    return raw ? (JSON.parse(raw) as QuestionnaireDraft) : null;
  } catch {
    return null;
  }
}

export function clearDraft(analysisId: string): void {
  localStorage.removeItem(`${DRAFT_KEY_PREFIX}${analysisId}`);
}

// ─── Validation ───────────────────────────────────────────────────────────────
export function validateSection(
  questions: Question[],
  answers: Record<string, QuestionValue>
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const q of questions) {
    if (!isQuestionVisible(q, answers)) continue;
    if (q.required && isValueEmpty(answers[q.id] ?? null)) {
      errors[q.id] = 'This field is required';
    }
  }
  return errors;
}

// ─── Completion statistics ────────────────────────────────────────────────────
export function computeCompletion(
  sections: QuestionGroup[],
  answers: Record<string, QuestionValue>
): { total: number; answered: number; percent: number } {
  let total = 0;
  let answered = 0;
  for (const section of sections) {
    for (const q of section.questions) {
      if (!isQuestionVisible(q, answers)) continue;
      if (q.required) {
        total++;
        if (!isValueEmpty(answers[q.id] ?? null)) answered++;
      }
    }
  }
  return { total, answered, percent: total > 0 ? Math.round((answered / total) * 100) : 0 };
}

// ─── Per-section completion (for progress stepper) ───────────────────────────
export function isSectionComplete(
  section: QuestionGroup,
  answers: Record<string, QuestionValue>
): boolean {
  for (const q of section.questions) {
    if (!isQuestionVisible(q, answers)) continue;
    if (q.required && isValueEmpty(answers[q.id] ?? null)) return false;
  }
  return true;
}
