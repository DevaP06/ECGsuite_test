
import DoctorProfileCard from "../components/doctor/DoctorProfileCard";
import DoctorOverview from "../components/doctor/DoctorOverview";
import RecentPatients from "../components/doctor/RecentPatients";
import RecentECGs from "../components/doctor/RecentECGs";
import AppointmentsPanel from "../components/doctor/AppointmentsPanel";
import AlertsPanel from "../components/doctor/AlertsPanel";
import DashboardLayout from "../components/layout/DashboardLayout";

export default function Dashboard() {
  return (
    <DashboardLayout>
      <h2 className="text-2xl font-bold mb-6">Welcome back!</h2>

      <div className="grid grid-cols-12 gap-6">
        {/* Left: Doctor Profile */}
        <div className="col-span-4">
          <DoctorProfileCard />
        </div>

        {/* Right: Overview Stats */}
        <div className="col-span-8">
          <DoctorOverview />
        </div>
      </div>

      {/* Middle row */}
      <div className="grid grid-cols-2 gap-6 mt-6">
        <RecentPatients />
        <RecentECGs />
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-2 gap-6 mt-6">
        <AppointmentsPanel />
        <AlertsPanel />
      </div>
    </DashboardLayout>
  );
}
    