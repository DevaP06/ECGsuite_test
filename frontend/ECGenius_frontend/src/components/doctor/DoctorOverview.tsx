import { Users, Activity, FileText } from "lucide-react";
import StatsCard from "../common/StatsCard";

export default function DoctorOverview() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <StatsCard
        title="Patients"
        value={12}
        icon={<Users className="w-6 h-6" />}
        trend="+3 this week"
        trendColor="green"
        subtitle="Active patients under care"
      />
      <StatsCard
        title="ECGs Uploaded"
        value={34}
        icon={<Activity className="w-6 h-6" />}
        trend="+10%"
        trendColor="green"
        subtitle="Compared to last month"
      />
      <StatsCard
        title="Pending Reports"
        value={5}
        icon={<FileText className="w-6 h-6" />}
        trend="-2 this week"
        trendColor="red"
        subtitle="Awaiting review"
      />
    </div>
  );
}
