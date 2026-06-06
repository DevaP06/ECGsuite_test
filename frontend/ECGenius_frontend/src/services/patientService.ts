import AxiosInstance from '../AxiosInstance';
import type {
  Patient,
  PatientListItem,
  PatientListResponse,
  CreatePatientPayload,
  PatientQuery,
} from '../types/patient';
import type { ECGAnalysis } from '../types/ecg';

// ─── Patient CRUD service ─────────────────────────────────────────────────────
// All calls are proxied through AxiosInstance (base URL + auth headers set there).
// Backend endpoints expected:
//   GET    /api/patients              → PatientListResponse
//   GET    /api/patients/:id          → Patient
//   POST   /api/patients              → Patient
//   GET    /api/patients/:id/analyses → { analyses: ECGAnalysis[] }

export const patientService = {

  async getPatients(query: PatientQuery = {}): Promise<PatientListResponse> {
    const params = new URLSearchParams();
    if (query.q)        params.set('q',        query.q);
    if (query.sort)     params.set('sort',      query.sort);
    if (query.dir)      params.set('dir',       query.dir);
    if (query.page)     params.set('page',      String(query.page));
    if (query.pageSize) params.set('pageSize',  String(query.pageSize));

    const res = await AxiosInstance.get<PatientListResponse>(
      `/api/patients?${params.toString()}`
    );
    // Normalise envelope variants: { data, total } or { patients, total }
    const body = res.data as Record<string, unknown>;
    const data = (body.data ?? body.patients ?? []) as PatientListItem[];
    const total = (typeof body.total === 'number' ? body.total : data.length);
    const page = (typeof body.page === 'number' ? body.page : (query.page ?? 1));
    const pageSize = (typeof body.pageSize === 'number' ? body.pageSize : (query.pageSize ?? 10));
    return { data, total, page, pageSize };
  },

  async getPatient(id: string): Promise<Patient> {
    const res = await AxiosInstance.get<Patient>(`/api/patients/${id}`);
    const body = res.data as Record<string, unknown>;
    // Support envelope: { patient: {...} } or flat
    return (body.patient ?? body) as Patient;
  },

  async createPatient(payload: CreatePatientPayload): Promise<Patient> {
    const res = await AxiosInstance.post<Patient>('/api/patients', payload);
    const body = res.data as Record<string, unknown>;
    return (body.patient ?? body) as Patient;
  },

  async getPatientAnalyses(patientId: string): Promise<ECGAnalysis[]> {
    const res = await AxiosInstance.get<{ analyses: ECGAnalysis[] }>(
      `/api/patients/${patientId}/analyses`
    );
    const body = res.data as Record<string, unknown>;
    return ((body.analyses ?? body.data ?? []) as ECGAnalysis[]);
  },
};
