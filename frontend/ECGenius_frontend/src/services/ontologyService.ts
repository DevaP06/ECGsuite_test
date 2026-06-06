// Ontology Rule service — Task 41
// All endpoints are pending backend implementation.
// Returns [] on 404 so the page shows graceful empty state.

import AxiosInstance from '../AxiosInstance';
import type { OntologyRule } from '../types/ontology';

function is404(err: unknown): boolean {
  const e = err as Record<string, unknown>;
  const status = (e.response as Record<string, unknown> | undefined)?.status;
  return status === 404;
}

export const ontologyService = {
  // GET /api/ontology/rules  (CARDIOLOGIST | ADMIN — pending backend)
  async getRules(): Promise<OntologyRule[]> {
    try {
      const res = await AxiosInstance.get<unknown>('/api/ontology/rules');
      const body = res.data as Record<string, unknown>;
      return ((body.rules ?? body.data ?? []) as OntologyRule[]);
    } catch (err: unknown) {
      if (is404(err)) return [];
      throw err;
    }
  },

  // GET /api/ontology/rules/:id  (CARDIOLOGIST | ADMIN — pending)
  async getRule(id: string): Promise<OntologyRule | null> {
    try {
      const res = await AxiosInstance.get<unknown>(`/api/ontology/rules/${id}`);
      const body = res.data as Record<string, unknown>;
      return (body.rule ?? body) as OntologyRule;
    } catch (err: unknown) {
      if (is404(err)) return null;
      throw err;
    }
  },
};
