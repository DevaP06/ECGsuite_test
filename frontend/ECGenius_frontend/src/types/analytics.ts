// Analytics types for Tasks 38-41 (Review Analytics, Metrics, Insights)

// Per-day review activity
export interface DailyReviewStat {
  date: string;      // ISO date string "2026-06-01"
  reviewed: number;
  overridden: number;
  escalated: number;
  avgMinutes: number;
}

// Accuracy breakdown vs. AI
export interface AccuracyMetrics {
  totalReviewed: number;
  aiCorrect: number;
  aiOverridden: number;
  overrideRate: number;       // 0–1
  topOverriddenRhythm?: string;
}

// SLA compliance (response time tiers)
export interface SlaMetrics {
  tier1Critical: { target: number; met: number; total: number };  // 4-hour target
  tier2Urgent:   { target: number; met: number; total: number };  // 24-hour target
  tier3Normal:   { target: number; met: number; total: number };  // 48-hour target
}

// Aggregated stats for CardiologistDashboard / AnalyticsPage
export interface ReviewMetrics {
  period: 'day' | 'week' | 'month' | 'all';
  totalReviewed: number;
  pendingCount: number;
  completedToday: number;
  avgReviewMinutes: number;
  accuracy: AccuracyMetrics;
  sla: SlaMetrics;
  dailyStats: DailyReviewStat[];
}

// Diagnosis distribution for AI Insights page
export interface DiagnosisDistribution {
  rhythm: string;
  count: number;
  overrideCount: number;
  confidence: number;
}

// Complete insights payload for CardiologistInsightsPage
export interface CardiologistInsights {
  period: string;
  totalCases: number;
  diagnosisDistribution: DiagnosisDistribution[];
  topAbnormalities: { label: string; count: number }[];
  conditionTrends: { date: string; condition: string; count: number }[];
}

// Active learning feedback types — Task 40
export type FeedbackType =
  | 'model_correct'
  | 'model_incorrect'
  | 'needs_more_data'
  | 'false_positive'
  | 'false_negative';

export interface FeedbackPayload {
  analysisId: string;
  feedbackType: FeedbackType;
  notes?: string;
}

export interface FeedbackRecord {
  _id: string;
  analysisId: string;
  cardiologistId: string;
  feedbackType: FeedbackType;
  notes?: string;
  createdAt: string;
}
