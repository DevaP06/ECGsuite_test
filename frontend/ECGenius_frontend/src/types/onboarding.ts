import type { UserRole } from './rbac';

export interface OnboardingProfile {
  fullName: string;
  phone: string;
  // PHC Doctor
  medicalRegistrationNumber?: string;
  hospitalName?: string;
  state?: string;
  // Cardiologist
  cardiologyRegistrationNumber?: string;
  hospital?: string;
  yearsOfExperience?: string;
  // Patient
  age?: string;
  gender?: string;
  // Admin
  organization?: string;
}

export type ProfileFieldKey = keyof Omit<OnboardingProfile, 'fullName' | 'phone'>;

export interface ProfileFieldDef {
  key: ProfileFieldKey;
  label: string;
  type: 'text' | 'number' | 'select';
  placeholder?: string;
  options?: string[];
}

// Full Name and Phone Number are collected for every role and rendered first;
// these tables hold only the role-specific fields that follow.
export const ROLE_PROFILE_FIELDS: Record<UserRole, ProfileFieldDef[]> = {
  PHC_DOCTOR: [
    { key: 'medicalRegistrationNumber', label: 'Medical Registration Number', type: 'text', placeholder: 'e.g. MCI-123456' },
    { key: 'hospitalName', label: 'Hospital / Clinic Name', type: 'text', placeholder: 'e.g. City Primary Health Centre' },
    { key: 'state', label: 'State', type: 'text', placeholder: 'e.g. Maharashtra' },
  ],
  CARDIOLOGIST: [
    { key: 'cardiologyRegistrationNumber', label: 'Cardiology Registration Number', type: 'text', placeholder: 'e.g. CARD-998877' },
    { key: 'hospital', label: 'Hospital', type: 'text', placeholder: 'e.g. Apollo Heart Institute' },
    { key: 'yearsOfExperience', label: 'Years of Experience', type: 'number', placeholder: 'e.g. 8' },
  ],
  PATIENT: [
    { key: 'age', label: 'Age', type: 'number', placeholder: 'e.g. 42' },
    { key: 'gender', label: 'Gender', type: 'select', options: ['Male', 'Female', 'Other', 'Prefer not to say'] },
  ],
  ADMIN: [
    { key: 'organization', label: 'Organization', type: 'text', placeholder: 'e.g. ECGenius Health Network' },
  ],
};
