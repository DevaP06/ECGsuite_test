import React, { createContext, useContext, useState } from "react";

interface ECG {
  id: string;
  patientId: string;
  data: unknown;
}

interface ECGContextType {
  ecgs: ECG[];
  addEcg: (ecg: ECG) => void;
  getEcg: (id: string) => ECG | undefined;
}

const ECGContext = createContext<ECGContextType | undefined>(undefined);

export const ECGProvider = ({ children }: { children: React.ReactNode }) => {
  const [ecgs, setEcgs] = useState<ECG[]>([]);

  const addEcg = (ecg: ECG) => setEcgs((prev) => [...prev, ecg]);
  const getEcg = (id: string) => ecgs.find((e) => e.id === id);

  return (
    <ECGContext.Provider value={{ ecgs, addEcg, getEcg }}>
      {children}
    </ECGContext.Provider>
  );
};

export const useEcg = () => {
  const context = useContext(ECGContext);
  if (!context) {
    throw new Error("useEcg must be used within an ECGProvider");
  }
  return context;
};
