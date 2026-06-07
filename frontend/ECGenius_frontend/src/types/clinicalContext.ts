import type { TopPrediction } from './ecg';

export type QuestionCategory = 'symptoms' | 'riskFactors' | 'vitals';
export type AnswerValue = 'yes' | 'no' | 'unknown';

export interface Question {
  id: string;
  key: string;
  category: QuestionCategory;
  label: string;
  relevantRhythms: string[];
}

export interface QuestionnaireDefinition {
  topRhythms: TopPrediction[];
  questions: Question[];
  categories: Record<QuestionCategory, Question[]>;
  coverage: number;
}

export interface QuestionnaireResponse {
  analysisId: string;
  answers: Record<string, AnswerValue>;
  updatedAt: string;
}

export interface ClinicalContext {
  symptoms: Record<string, boolean>;
  riskFactors: Record<string, boolean>;
  vitals: Record<string, boolean>;
}

export interface RhythmHistoryEntry {
  symptoms: string[];
  risk_factors: string[];
  vitals: string[];
}

export type RhythmQuestionMap = Record<string, RhythmHistoryEntry>;
