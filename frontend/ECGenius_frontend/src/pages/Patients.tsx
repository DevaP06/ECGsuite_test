import DashboardLayout from "../components/layout/DashboardLayout";
import PatientsTable from "../components/Patients/PatientsTables";

export default function Patients() {
  return (
    <DashboardLayout>
      <h2 className="text-2xl font-bold mb-6">Patients</h2>
      <PatientsTable />
    </DashboardLayout>
  );
}
