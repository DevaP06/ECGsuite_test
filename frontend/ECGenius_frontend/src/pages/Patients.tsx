import AppShell from "../layouts/AppShell";
import PatientsTable from "../components/Patients/PatientsTables";

export default function Patients() {
  return (
    <AppShell title="Patients">
      <PatientsTable />
    </AppShell>
  );
}
