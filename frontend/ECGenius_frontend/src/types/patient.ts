// ─── Contact ──────────────────────────────────────────────────────────────────
export interface PatientContact {
  phone: string;
  email?: string;
  address?: string;
  emergencyContact?: string;
}

// ─── Medical profile (free-text fields, stored as strings for MVP) ────────────
export interface PatientMedicalProfile {
  knownConditions?: string;
  currentMedications?: string;
  medicalHistory?: string;
  notes?: string;
}

// ─── Full patient record (returned by GET /api/patients/:id) ─────────────────
export interface Patient {
  _id: string;
  name: string;
  age: number;
  gender: string;
  contact: PatientContact;
  medicalProfile?: PatientMedicalProfile;
  registeredBy?: string;
  createdAt: string;
  updatedAt?: string;
  // Aggregated / populated fields
  lastVisit?: string;
  totalECGs?: number;
}

// ─── Lightweight list item (returned by GET /api/patients) ───────────────────
export interface PatientListItem {
  _id: string;
  name: string;
  age: number;
  gender: string;
  phone?: string;
  lastVisit?: string;
  totalECGs?: number;
  latestStatus?: string;
  createdAt: string;
}

// ─── Payload for patient creation ────────────────────────────────────────────
export interface CreatePatientPayload {
  name: string;
  age: number;
  gender: string;
  contact: PatientContact;
  medicalProfile?: PatientMedicalProfile;
}

// ─── Query params for patient list ───────────────────────────────────────────
export interface PatientQuery {
  q?: string;
  sort?: 'name' | 'age' | 'lastVisit' | 'createdAt';
  dir?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

// ─── Paginated list response ─────────────────────────────────────────────────
export interface PatientListResponse {
  data: PatientListItem[];
  total: number;
  page: number;
  pageSize: number;
}
