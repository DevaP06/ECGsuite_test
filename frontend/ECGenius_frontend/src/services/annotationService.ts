// Annotation + Validation service — Tasks 36–37
// All endpoints are pending backend implementation.
// Returns null / [] on 404 so components show graceful empty states.

import AxiosInstance from '../AxiosInstance';
import type {
  AnnotationRecord,
  ValidationRecord,
  CreateAnnotationPayload,
  CreateValidationPayload,
} from '../types/annotation';

function is404(err: unknown): boolean {
  const e = err as Record<string, unknown>;
  const status = (e.response as Record<string, unknown> | undefined)?.status;
  return status === 404;
}

export const annotationService = {
  // POST /api/ecg/analysis/:id/annotation  (CARDIOLOGIST only — pending)
  async createAnnotation(
    analysisId: string,
    payload: CreateAnnotationPayload,
  ): Promise<AnnotationRecord> {
    const res = await AxiosInstance.post<unknown>(
      `/api/ecg/analysis/${analysisId}/annotation`,
      payload,
    );
    const body = res.data as Record<string, unknown>;
    return (body.annotation ?? body) as AnnotationRecord;
  },

  // GET /api/ecg/analysis/:id/annotation  (pending)
  async getAnnotation(analysisId: string): Promise<AnnotationRecord | null> {
    try {
      const res = await AxiosInstance.get<unknown>(
        `/api/ecg/analysis/${analysisId}/annotation`,
      );
      const body = res.data as Record<string, unknown>;
      return (body.annotation ?? body) as AnnotationRecord;
    } catch (err: unknown) {
      if (is404(err)) return null;
      throw err;
    }
  },

  // POST /api/ecg/analysis/:id/validation  (CARDIOLOGIST only — pending)
  async createValidation(
    analysisId: string,
    payload: CreateValidationPayload,
  ): Promise<ValidationRecord> {
    const res = await AxiosInstance.post<unknown>(
      `/api/ecg/analysis/${analysisId}/validation`,
      payload,
    );
    const body = res.data as Record<string, unknown>;
    return (body.validation ?? body) as ValidationRecord;
  },

  // GET /api/ecg/analysis/:id/validation  (pending)
  async getValidation(analysisId: string): Promise<ValidationRecord | null> {
    try {
      const res = await AxiosInstance.get<unknown>(
        `/api/ecg/analysis/${analysisId}/validation`,
      );
      const body = res.data as Record<string, unknown>;
      return (body.validation ?? body) as ValidationRecord;
    } catch (err: unknown) {
      if (is404(err)) return null;
      throw err;
    }
  },
};
