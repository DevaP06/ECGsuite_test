import { useParams } from "react-router-dom";
import DashboardLayout from "../components/layout/DashboardLayout";
import PatientHeader from "../components/Patients/PatientHeader";
import PatientVitals from "../components/Patients/PatientVitals";
import PatientHistory from "../components/Patients/PatientHistory";
import PatientLabs from "../components/Patients/PatientLabs";
import PatientMedications from "../components/Patients/PatientMedication";
import PatientAppointments from "../components/Patients/PatientAppointments";
import PatientECGs from "../components/Patients/PatientECGs";

export default function PatientDetail() {
  const { id: _id } = useParams();

  return (
    <DashboardLayout>
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
    </DashboardLayout>
  );
}
