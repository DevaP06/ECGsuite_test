// Analytics service — Tasks 38–41
// All endpoints are pending backend implementation.
// Returns sensible empty shapes on 404.

import AxiosInstance from '../AxiosInstance';
import type { ReviewMetrics, CardiologistInsights } from '../types/analytics';

function is404(err: unknown): boolean {
  const e = err as Record<string, unknown>;
  const status = (e.response as Record<string, unknown> | undefined)?.status;
  return status === 404;
}

const EMPTY_METRICS: ReviewMetrics = {
  period: 'week',
  totalReviewed: 0,
  pendingCount: 0,
  completedToday: 0,
  avgReviewMinutes: 0,
  accuracy: {
    totalReviewed: 0,
    aiCorrect: 0,
    aiOverridden: 0,
    overrideRate: 0,
  },
  sla: {
    tier1Critical: { target: 4,  met: 0, total: 0 },
    tier2Urgent:   { target: 24, met: 0, total: 0 },
    tier3Normal:   { target: 48, met: 0, total: 0 },
  },
  dailyStats: [],
};

export const analyticsService = {
  // GET /api/analytics/review-metrics?period=week  (CARDIOLOGIST — pending)
  async getReviewMetrics(period: 'day' | 'week' | 'month' | 'all' = 'week'): Promise<ReviewMetrics> {
    try {
      const res = await AxiosInstance.get<unknown>('/api/analytics/review-metrics', {
        params: { period },
      });
      const body = res.data as Record<string, unknown>;
      return (body.metrics ?? body) as ReviewMetrics;
    } catch (err: unknown) {
      if (is404(err)) return { ...EMPTY_METRICS, period };
      throw err;
    }
  },

  // GET /api/analytics/insights?period=month  (CARDIOLOGIST — pending)
  async getInsights(period: string = 'month'): Promise<CardiologistInsights> {
    try {
      const res = await AxiosInstance.get<unknown>('/api/analytics/insights', {
        params: { period },
      });
      const body = res.data as Record<string, unknown>;
      return (body.insights ?? body) as CardiologistInsights;
    } catch (err: unknown) {
      if (is404(err)) {
        return {
          period,
          totalCases: 0,
          diagnosisDistribution: [],
          topAbnormalities: [],
          conditionTrends: [],
        };
      }
      throw err;
    }
  },
};
