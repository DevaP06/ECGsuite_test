import AxiosInstance from '../AxiosInstance';
import type {
  SpecialistReview,
  ReviewQueueItem,
  RequestReviewPayload,
  SubmitDecisionPayload,
} from '../types/review';

function is404(err: unknown): boolean {
  const e = err as Record<string, unknown>;
  const status = (e.response as Record<string, unknown> | undefined)?.status;
  return status === 404;
}

function normalizeReview(raw: unknown): SpecialistReview {
  const r = raw as Record<string, unknown>;
  return (r.review ?? r) as SpecialistReview;
}

export const reviewService = {
  // ── LIVE ENDPOINT ──────────────────────────────────────────────────────────
  // POST /api/ecg/analysis/:id/specialist-review  (CARDIOLOGIST only, mlLimiter)
  // Body: { reviewStatus, expertDiagnosis?, overrideReason?, reviewNotes? }
  async submitDecision(
    analysisId: string,
    payload: SubmitDecisionPayload,
  ): Promise<SpecialistReview> {
    const res = await AxiosInstance.post<unknown>(
      `/api/ecg/analysis/${analysisId}/specialist-review`,
      payload,
    );
    return normalizeReview(res.data);
  },

  // ── PENDING BACKEND ENDPOINTS ──────────────────────────────────────────────
  // The following endpoints are not yet implemented on the backend.
  // They return null / [] on 404 so components show graceful empty states.
  // When backend adds these routes, only the URL strings need to change.

  // POST /api/review/request  (PHC_DOCTOR only)
  async requestReview(payload: RequestReviewPayload): Promise<void> {
    await AxiosInstance.post('/api/review/request', payload);
  },

  // GET /api/review/queue  (CARDIOLOGIST only)
  async getQueue(): Promise<ReviewQueueItem[]> {
    try {
      const res = await AxiosInstance.get<unknown>('/api/review/queue');
      const body = res.data as Record<string, unknown>;
      // Backend wraps as { success, message, data: { reviews, pagination } } — double-nested.
      const payload = body.data as Record<string, unknown> | undefined;
      const list = payload?.reviews ?? body.reviews;
      return Array.isArray(list) ? (list as ReviewQueueItem[]) : [];
    } catch (err: unknown) {
      if (is404(err)) return [];
      throw err;
    }
  },

  // GET /api/ecg/analysis/:id/review  (any authenticated user)
  async getAnalysisReview(analysisId: string): Promise<SpecialistReview | null> {
    try {
      const res = await AxiosInstance.get<unknown>(
        `/api/ecg/analysis/${analysisId}/review`,
      );
      return normalizeReview(res.data);
    } catch (err: unknown) {
      if (is404(err)) return null;
      throw err;
    }
  },

  // GET /api/review/my-requests  (PHC_DOCTOR — their submitted review requests)
  async getMyRequests(): Promise<ReviewQueueItem[]> {
    try {
      const res = await AxiosInstance.get<unknown>('/api/review/my-requests');
      const body = res.data as Record<string, unknown>;
      // Backend wraps as { success, message, data: { requests, pagination } } — double-nested.
      const payload = body.data as Record<string, unknown> | undefined;
      const list = payload?.requests ?? body.requests;
      return Array.isArray(list) ? (list as ReviewQueueItem[]) : [];
    } catch (err: unknown) {
      if (is404(err)) return [];
      throw err;
    }
  },
};
