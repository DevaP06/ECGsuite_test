// Pure derivation of a patient's risk-summary view from already-fetched
// analyses, locally-stored clinical-context submissions, and specialist review
// records. Strictly counts/groups/surfaces real backend or locally-submitted
// data — computes no risk score and assigns no risk category of its own.
// "Risk Category" reflects only the urgency/severity fields the backend
// already attached to the most recent completed analysis, shown verbatim.

import { getQuestionLabel } from '../data/questionLabels';
import type { ECGAnalysis } from '../types/ecg';
import type { ClinicalContext } from '../types/clinicalContext';
import type { SpecialistReview, ReviewStatus } from '../types/review';

export interface RiskFactorTally {
  key: string;
  label: string;
  occurrences: number;
}

export interface HistoricalDiagnosisEntry {
  analysisId: string;
  rhythm: string;
  confidence?: number;
  createdAt: string;
}

export interface RhythmTrendEntry {
  rhythm: string;
  count: number;
}

export interface ReviewOutcomeEntry {
  analysisId: string;
  reviewStatus: ReviewStatus;
  expertDiagnosis?: string;
  overrideReason?: string;
  reviewNotes?: string;
  reviewDate?: string;
}

export interface RiskCategoryInfo {
  analysisId: string;
  displayName?: string;
  urgencyTier?: string;
  severity?: string;
  isEmergency: boolean;
  createdAt: string;
}

export interface RiskSummary {
  riskFactors: RiskFactorTally[];
  historicalDiagnoses: HistoricalDiagnosisEntry[];
  rhythmTrend: RhythmTrendEntry[];
  reviewOutcomes: ReviewOutcomeEntry[];
  riskCategory: RiskCategoryInfo | null;
}

const HISTORY_LIMIT = 10;
const TREND_LIMIT = 8;

function buildRiskFactorTally(contexts: Map<string, ClinicalContext | null>): RiskFactorTally[] {
  const counts = new Map<string, number>();
  contexts.forEach((context) => {
    if (!context) return;
    Object.entries(context.riskFactors).forEach(([key, present]) => {
      if (!present) return;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });
  });
  return Array.from(counts.entries())
    .map(([key, occurrences]) => ({ key, label: getQuestionLabel(key), occurrences }))
    .sort((a, b) => b.occurrences - a.occurrences);
}

function buildHistoricalDiagnoses(analyses: ECGAnalysis[]): HistoricalDiagnosisEntry[] {
  return [...analyses]
    .filter((a) => a.status === 'completed' && a.analysisResult)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, HISTORY_LIMIT)
    .map((a) => ({
      analysisId: a._id,
      rhythm: a.analysisResult?.rhythm ?? 'unknown',
      confidence: a.analysisResult?.confidence ?? 0,
      createdAt: a.createdAt,
    }));
}

function buildRhythmTrend(analyses: ECGAnalysis[]): RhythmTrendEntry[] {
  const counts = new Map<string, number>();
  analyses.forEach((a) => {
    const rhythm = a.analysisResult?.rhythm;
    if (a.status !== 'completed' || !rhythm) return;
    counts.set(rhythm, (counts.get(rhythm) ?? 0) + 1);
  });
  return Array.from(counts.entries())
    .map(([rhythm, count]) => ({ rhythm, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, TREND_LIMIT);
}

function buildReviewOutcomes(
  analyses: ECGAnalysis[],
  reviews: Map<string, SpecialistReview | null>,
): ReviewOutcomeEntry[] {
  const outcomes: ReviewOutcomeEntry[] = [];
  analyses.forEach((a) => {
    const review = reviews.get(a._id);
    if (!review || review.reviewStatus !== 'completed') return;
    outcomes.push({
      analysisId: a._id,
      reviewStatus: review.reviewStatus,
      expertDiagnosis: review.expertDiagnosis,
      overrideReason: review.overrideReason,
      reviewNotes: review.reviewNotes,
      reviewDate: review.reviewDate,
    });
  });
  return outcomes.sort(
    (a, b) => new Date(b.reviewDate ?? b.analysisId).getTime() - new Date(a.reviewDate ?? a.analysisId).getTime(),
  );
}

function buildRiskCategory(analyses: ECGAnalysis[]): RiskCategoryInfo | null {
  const latest = [...analyses]
    .filter((a) => a.status === 'completed' && a.analysisResult)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

  if (!latest?.analysisResult) return null;

  const topItem = latest.analysisResult.ontologyEnrichment?.[0];
  const isEmergency = latest.analysisResult.isEmergency === true || topItem?.isEmergency === true;

  if (!topItem && !isEmergency) return null;

  return {
    analysisId: latest._id,
    displayName: topItem?.displayName,
    urgencyTier: topItem?.urgencyTier,
    severity: topItem?.severity,
    isEmergency,
    createdAt: latest.createdAt,
  };
}

export function buildRiskSummary(
  analyses: ECGAnalysis[],
  contexts: Map<string, ClinicalContext | null>,
  reviews: Map<string, SpecialistReview | null>,
): RiskSummary {
  return {
    riskFactors: buildRiskFactorTally(contexts),
    historicalDiagnoses: buildHistoricalDiagnoses(analyses),
    rhythmTrend: buildRhythmTrend(analyses),
    reviewOutcomes: buildReviewOutcomes(analyses, reviews),
    riskCategory: buildRiskCategory(analyses),
  };
}
