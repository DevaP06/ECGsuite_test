import React, { createContext, useContext, useState } from "react";

// 👤 Patient Type
export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
}

// 📌 Context Type
interface PatientContextType {
  patients: Patient[];
  addPatient: (p: Patient) => void;
  getPatient: (id: string) => Patient | undefined;
}

// 🟢 Create Context
const PatientContext = createContext<PatientContextType | undefined>(undefined);

// 🟢 Provider Component
export const PatientProvider = ({ children }: { children: React.ReactNode }) => {
  const [patients, setPatients] = useState<Patient[]>([]);

  // Add patient
  const addPatient = (p: Patient) => {
    setPatients((prev) => [...prev, p]);
  };

  // Get patient by ID
  const getPatient = (id: string) => patients.find((p) => p.id === id);

  return (
    <PatientContext.Provider value={{ patients, addPatient, getPatient }}>
      {children}
    </PatientContext.Provider>
  );
};

// 🟢 Hook to use Patient Context
export const usePatients = () => {
  const context = useContext(PatientContext);
  if (!context) {
    throw new Error("usePatients must be used within a PatientProvider");
  }
  return context;
};
