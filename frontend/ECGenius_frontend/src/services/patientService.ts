import AxiosInstance from '../AxiosInstance';
import type {
  Patient,
  PatientListItem,
  PatientListResponse,
  CreatePatientPayload,
  PatientQuery,
  PatientTrends,
} from '../types/patient';
import type { ECGAnalysis } from '../types/ecg';

// ─── Patient CRUD service ─────────────────────────────────────────────────────
// All calls are proxied through AxiosInstance (base URL + auth headers set there).
// Backend endpoints expected:
//   GET    /api/patients              → PatientListResponse
//   GET    /api/patients/:id          → Patient
//   POST   /api/patients              → Patient
//   GET    /api/patients/:id/analyses → { analyses: ECGAnalysis[] }
//   GET    /api/patients/:id/trends   → PatientTrends

export const patientService = {

  async getPatients(query: PatientQuery = {}): Promise<PatientListResponse> {
    const params = new URLSearchParams();
    if (query.q)        params.set('q',        query.q);
    if (query.sort)     params.set('sort',      query.sort);
    if (query.dir)      params.set('dir',       query.dir);
    if (query.page)     params.set('page',      String(query.page));
    if (query.pageSize) params.set('pageSize',  String(query.pageSize));

    const res = await AxiosInstance.get<unknown>(
      `/api/patients?${params.toString()}`
    );
    // Backend wraps the payload as { success, message, data: { data, total, page, pageSize } }
    // — i.e. double-nested. Unwrap one extra level when `data` is itself an object (not the array).
    const body = res.data as unknown as Record<string, unknown>;
    const payload = (body.data && typeof body.data === 'object' && !Array.isArray(body.data))
      ? body.data as Record<string, unknown>
      : body;
    const rawList = payload.data ?? payload.patients ?? body.patients;
    const data = Array.isArray(rawList) ? (rawList as PatientListItem[]) : [];
    const total = (typeof payload.total === 'number' ? payload.total : data.length);
    const page = (typeof payload.page === 'number' ? payload.page : (query.page ?? 1));
    const pageSize = (typeof payload.pageSize === 'number' ? payload.pageSize : (query.pageSize ?? 10));
    return { data, total, page, pageSize };
  },

  async getPatient(id: string): Promise<Patient> {
    const res = await AxiosInstance.get<Patient>(`/api/patients/${id}`);
    const body = res.data as unknown as Record<string, unknown>;
    const payload = (body.data && typeof body.data === 'object' && !Array.isArray(body.data))
      ? body.data as Record<string, unknown>
      : body;
    return (payload.patient ?? payload) as Patient;
  },

  async createPatient(payload: CreatePatientPayload): Promise<Patient> {
    const res = await AxiosInstance.post<Patient>('/api/patients', payload);
    const body = res.data as unknown as Record<string, unknown>;
    const inner = (body.data && typeof body.data === 'object' && !Array.isArray(body.data))
      ? body.data as Record<string, unknown>
      : body;
    return (inner.patient ?? inner) as Patient;
  },

  async getPatientAnalyses(patientId: string): Promise<ECGAnalysis[]> {
    const res = await AxiosInstance.get<{ analyses: ECGAnalysis[] }>(
      `/api/patients/${patientId}/analyses`
    );
    const body = res.data as Record<string, unknown>;
    const payload = (body.data && typeof body.data === 'object' && !Array.isArray(body.data))
      ? body.data as Record<string, unknown>
      : body;
    const list = payload.analyses ?? body.analyses;
    return Array.isArray(list) ? (list as ECGAnalysis[]) : [];
  },

  async getPatientTrends(patientId: string): Promise<PatientTrends> {
    const res = await AxiosInstance.get<{ data: PatientTrends }>(
      `/api/patients/${patientId}/trends`
    );
    const body = res.data as unknown as Record<string, unknown>;
    return (body.data ?? body) as PatientTrends;
  },
};
