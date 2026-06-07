import type { TopPrediction } from '../types/ecg';
import type {
  Question,
  QuestionCategory,
  QuestionnaireDefinition,
  RhythmHistoryEntry,
} from '../types/clinicalContext';
import { HISTORY_SCHEMA } from '../data/historySchema';
import { getQuestionLabel } from '../data/questionLabels';

const CATEGORY_ORDER: QuestionCategory[] = ['symptoms', 'riskFactors', 'vitals'];
const CATEGORY_WEIGHT: Record<QuestionCategory, number> = {
  symptoms: 3,
  riskFactors: 2,
  vitals: 1,
};
const SCHEMA_FIELD: Record<QuestionCategory, keyof RhythmHistoryEntry> = {
  symptoms: 'symptoms',
  riskFactors: 'risk_factors',
  vitals: 'vitals',
};
const MAX_QUESTIONS = 15;

export function deduplicateQuestions(keys: string[]): string[] {
  return [...new Set(keys)];
}

export function groupByCategory(questions: Question[]): Record<QuestionCategory, Question[]> {
  const grouped: Record<QuestionCategory, Question[]> = {
    symptoms: [],
    riskFactors: [],
    vitals: [],
  };
  questions.forEach((question) => {
    grouped[question.category].push(question);
  });
  return grouped;
}

export function calculateCoverage(
  definition: QuestionnaireDefinition,
  topRhythms: TopPrediction[]
): number {
  const relevantKeys = new Set<string>();
  topRhythms.slice(0, 2).forEach(({ rhythm }) => {
    const entry = HISTORY_SCHEMA[rhythm];
    if (!entry) return;
    CATEGORY_ORDER.forEach((category) => {
      entry[SCHEMA_FIELD[category]].forEach((key) => relevantKeys.add(key));
    });
  });

  if (relevantKeys.size === 0) return 100;

  const includedKeys = new Set(definition.questions.map((question) => question.key));
  const includedRelevantCount = [...relevantKeys].filter((key) => includedKeys.has(key)).length;
  return Math.round((includedRelevantCount / relevantKeys.size) * 100);
}

interface Candidate {
  key: string;
  category: QuestionCategory;
  relevantRhythms: string[];
}

export function generateQuestionnaire(topRhythms: TopPrediction[]): QuestionnaireDefinition {
  const top2 = topRhythms.slice(0, 2);

  // Union + dedupe per category, recording which rhythms surfaced each key
  const candidatesByKey = new Map<string, Candidate>();
  CATEGORY_ORDER.forEach((category) => {
    top2.forEach(({ rhythm }) => {
      const entry = HISTORY_SCHEMA[rhythm];
      if (!entry) return;
      entry[SCHEMA_FIELD[category]].forEach((key) => {
        const existing = candidatesByKey.get(key);
        if (existing) {
          if (!existing.relevantRhythms.includes(rhythm)) {
            existing.relevantRhythms.push(rhythm);
          }
        } else {
          candidatesByKey.set(key, { key, category, relevantRhythms: [rhythm] });
        }
      });
    });
  });

  const candidates = [...candidatesByKey.values()];

  // Score: shared-by-both-rhythms candidates and higher-weight categories sort first
  const scored = candidates.map((candidate) => {
    const sharedByBothRhythms = top2.length > 1 && candidate.relevantRhythms.length > 1;
    const score = (sharedByBothRhythms ? 10 : 0) + CATEGORY_WEIGHT[candidate.category];
    return { candidate, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const kept = scored.slice(0, MAX_QUESTIONS).map(({ candidate }) => candidate);

  // Re-sort the kept set into category presentation order
  const keptByCategory = new Map<string, Candidate>(kept.map((candidate) => [candidate.key, candidate]));
  const orderedCandidates: Candidate[] = [];
  CATEGORY_ORDER.forEach((category) => {
    candidates
      .filter((candidate) => candidate.category === category && keptByCategory.has(candidate.key))
      .forEach((candidate) => orderedCandidates.push(candidate));
  });

  const questions: Question[] = orderedCandidates.map((candidate) => ({
    id: candidate.key,
    key: candidate.key,
    category: candidate.category,
    label: getQuestionLabel(candidate.key),
    relevantRhythms: candidate.relevantRhythms,
  }));

  const definition: QuestionnaireDefinition = {
    topRhythms: top2,
    questions,
    categories: groupByCategory(questions),
    coverage: 0,
  };
  definition.coverage = calculateCoverage(definition, top2);

  return definition;
}
