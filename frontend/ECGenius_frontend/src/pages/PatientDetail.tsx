import { useParams } from "react-router-dom";
import AppShell from "../layouts/AppShell";
import PatientHeader from "../components/patients/PatientHeader";
import PatientVitals from "../components/patients/PatientVitals";
import PatientHistory from "../components/patients/PatientHistory";
import PatientLabs from "../components/patients/PatientLabs";
import PatientMedications from "../components/patients/PatientMedication";
import PatientAppointments from "../components/patients/PatientAppointments";
import PatientECGs from "../components/patients/PatientECGs";

export default function PatientDetail() {
  useParams();

  return (
    <AppShell title="Patient Detail">
      <div className="space-y-6">
        <PatientHeader name="John Smith" age={58} gender="Male" lastVisit="2025-10-15" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <PatientVitals />
          <PatientHistory />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <PatientLabs />
          <PatientMedications />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <PatientAppointments />
          <PatientECGs />
        </div>
      </div>
    </AppShell>
  );
}
