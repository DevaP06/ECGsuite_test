// ─── Primitive answer value ───────────────────────────────────────────────────
export type QuestionValue = string | boolean | number | string[] | null;

// ─── Question types ───────────────────────────────────────────────────────────
export type QuestionType =
  | 'text'
  | 'textarea'
  | 'boolean'
  | 'single_select'
  | 'multi_select'
  | 'number'
  | 'date';

// ─── Select option ────────────────────────────────────────────────────────────
export interface QuestionOption {
  value: string;
  label: string;
}

// ─── Conditional display rule ─────────────────────────────────────────────────
export interface ShowIfCondition {
  field: string;
  equals: boolean | string | number;
}

// ─── Single question definition ───────────────────────────────────────────────
export interface Question {
  id: string;
  type: QuestionType;
  label: string;
  section: string;
  required?: boolean;
  placeholder?: string;
  hint?: string;
  showIf?: ShowIfCondition;
  options?: QuestionOption[];
  min?: number;
  max?: number;
  unit?: string;
}

// ─── Group of questions (one section) ────────────────────────────────────────
export interface QuestionGroup {
  id: string;
  label: string;
  description?: string;
  questions: Question[];
}

// ─── A single answer ─────────────────────────────────────────────────────────
export interface QuestionAnswer {
  questionId: string;
  value: QuestionValue;
}

// ─── Full questionnaire response from backend (or fallback) ──────────────────
export interface QuestionnaireResponse {
  analysisId: string;
  condition?: string;
  sections: QuestionGroup[];
}

// ─── Draft persisted to localStorage ─────────────────────────────────────────
export interface QuestionnaireDraft {
  analysisId: string;
  answers: QuestionAnswer[];
  savedAt: string; // ISO string
}

// ─── Submission payload ───────────────────────────────────────────────────────
export interface QuestionnaireSubmitPayload {
  answers: QuestionAnswer[];
}

// ─── Map form used internally by components ───────────────────────────────────
export type AnswersMap = Record<string, QuestionValue>;

// ─── Helpers ─────────────────────────────────────────────────────────────────
export function isQuestionVisible(q: Question, answers: AnswersMap): boolean {
  if (!q.showIf) return true;
  return answers[q.showIf.field] === q.showIf.equals;
}

export function answersMapToArray(map: AnswersMap): QuestionAnswer[] {
  return Object.entries(map).map(([questionId, value]) => ({ questionId, value }));
}

export function answersArrayToMap(arr: QuestionAnswer[]): AnswersMap {
  const map: AnswersMap = {};
  for (const { questionId, value } of arr) {
    map[questionId] = value;
  }
  return map;
}

export function isValueEmpty(value: QuestionValue): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  return false;
}
