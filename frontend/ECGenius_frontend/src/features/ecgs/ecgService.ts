import { mockECGs } from "../../utils/mockData";

export type ECGRecord = {
  id: string;
  date: string;
  status: "Normal" | "Abnormal";
  notes?: string;
};

export async function getECGsByPatient(patientId: string): Promise<ECGRecord[]> {
  await new Promise((res) => setTimeout(res, 200)); // simulate API delay
  return mockECGs[patientId] || [];
}
