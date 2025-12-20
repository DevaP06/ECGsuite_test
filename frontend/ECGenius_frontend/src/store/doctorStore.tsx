import React, { createContext, useContext, useState } from "react";

interface Doctor {
  id: string;
  name: string;
  specialty: string;
  hospital: string;
}

interface DoctorContextType {
  doctor: Doctor | null;
  setDoctor: (doc: Doctor) => void;
}

const DoctorContext = createContext<DoctorContextType | undefined>(undefined);

export const DoctorProvider = ({ children }: { children: React.ReactNode }) => {
  const [doctor, setDoctor] = useState<Doctor | null>(null);

  return (
    <DoctorContext.Provider value={{ doctor, setDoctor }}>
      {children}
    </DoctorContext.Provider>
  );
};

export const useDoctor = () => {
  const context = useContext(DoctorContext);
  if (!context) {
    throw new Error("useDoctor must be used within a DoctorProvider");
  }
  return context;
};
