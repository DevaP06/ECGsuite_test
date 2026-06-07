import AppShell from "../layouts/AppShell";
import PatientsTable from "../components/patients/PatientsTables";

export default function Patients() {
  return (
    <AppShell title="Patients">
      <PatientsTable />
    </AppShell>
  );
}
