// Pure derivation of a doctor's personal insights summary from their own
// uploaded analyses and submitted review requests — both already-fetchable via
// existing endpoints. Nothing is fabricated: trends/tallies/alerts are computed
// strictly by grouping and counting real records.

import type { ECGAnalysis } from '../types/ecg';
import type { ReviewQueueItem } from '../types/review';

export interface DoctorInsightsSummary {
  totalUploads: number;
  uploadTrend: { date: string; count: number }[];
  topAbnormalities: { label: string; count: number }[];
  pendingReviewsCount: number;
  emergencyAlerts: { analysisId: string; patientName: string; rhythm?: string; createdAt: string }[];
}

const TREND_DAYS = 14;
const TOP_ABNORMALITIES_LIMIT = 8;

function dayKey(iso: string): string {
  return iso.slice(0, 10); // 'YYYY-MM-DD'
}

function buildUploadTrend(analyses: ECGAnalysis[]): { date: string; count: number }[] {
  const counts = new Map<string, number>();
  analyses.forEach((analysis) => {
    if (!analysis.createdAt) return;
    const key = dayKey(analysis.createdAt);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });

  const days: { date: string; count: number }[] = [];
  const now = new Date();
  for (let i = TREND_DAYS - 1; i >= 0; i -= 1) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    days.push({ date: key, count: counts.get(key) ?? 0 });
  }
  return days;
}

function buildTopAbnormalities(analyses: ECGAnalysis[]): { label: string; count: number }[] {
  const counts = new Map<string, number>();
  analyses.forEach((analysis) => {
    (analysis.analysisResult?.abnormalities ?? []).forEach((label) => {
      const trimmed = label.trim();
      if (!trimmed) return;
      counts.set(trimmed, (counts.get(trimmed) ?? 0) + 1);
    });
  });
  return Array.from(counts.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, TOP_ABNORMALITIES_LIMIT);
}

function buildEmergencyAlerts(analyses: ECGAnalysis[]): DoctorInsightsSummary['emergencyAlerts'] {
  return analyses
    .filter((analysis) => analysis.analysisResult?.isEmergency === true)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map((analysis) => ({
      analysisId: analysis._id,
      patientName: analysis.patientInfo?.name ?? 'Unknown patient',
      rhythm: analysis.analysisResult?.rhythm,
      createdAt: analysis.createdAt,
    }));
}

export function buildDoctorInsights(
  analyses: ECGAnalysis[],
  requests: ReviewQueueItem[],
): DoctorInsightsSummary {
  return {
    totalUploads: analyses.length,
    uploadTrend: buildUploadTrend(analyses),
    topAbnormalities: buildTopAbnormalities(analyses),
    pendingReviewsCount: requests.filter((r) => r.status === 'pending').length,
    emergencyAlerts: buildEmergencyAlerts(analyses),
  };
}
