import { ReactNode } from "react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: string; // e.g. "+5.4%"
  trendColor?: "green" | "red";
  subtitle?: string;
}

export default function StatsCard({ title, value, icon, trend, trendColor, subtitle }: StatsCardProps) {
  return (
    <div className="bg-white shadow-md rounded-2xl p-5 flex items-center justify-between transition transform hover:scale-[1.02] hover:shadow-lg">
      {/* Left Side */}
      <div>
        <h4 className="text-gray-500 text-sm font-medium">{title}</h4>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
      </div>

      {/* Right Side (Icon + Trend) */}
      <div className="flex flex-col items-end">
        <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
          {icon}
        </div>
        {trend && (
          <span
            className={`text-xs font-semibold mt-2 ${
              trendColor === "green" ? "text-green-600" : "text-red-600"
            }`}
          >
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}
