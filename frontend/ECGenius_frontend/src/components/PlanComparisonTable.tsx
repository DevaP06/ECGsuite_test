import { CheckCircle2, XCircle } from "lucide-react";
import React from "react";

const plans = ["EC Lite", "ECG Pulse", "EC Master"];

const featureRows = [
  {
    feature: "ECGs/month",
    values: ["Limited", "1000 ECGs", "Unlimited"],
  },
  {
    feature: "AI Insights",
    values: [false, true, true],
  },
  {
    feature: "Priority Support",
    values: [false, true, true],
  },
  {
    feature: "Report Download",
    values: [false, true, true],
  },
  {
    feature: "Advanced Analytics",
    values: [false, false, true],
  },
];

const PlanComparisonTable: React.FC = () => (
  <section className="w-full max-w-4xl mx-auto py-16 px-4">
    <h2 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">Compare Plans</h2>
    <div className="overflow-x-auto border rounded-lg bg-white dark:bg-zinc-900 shadow-md">
      <table className="min-w-full table-auto text-left">
        <thead>
          <tr className="bg-zinc-100 dark:bg-zinc-800">
            <th className="px-4 py-4 border-b text-base font-semibold text-zinc-700 dark:text-zinc-300">Feature</th>
            {plans.map((plan) => (
              <th
                key={plan}
                className="px-4 py-4 border-b text-base font-semibold text-zinc-700 dark:text-zinc-300 text-center"
              >
                {plan}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {featureRows.map((row, idx) => (
            <tr key={row.feature} className={idx % 2 === 0 ? "bg-zinc-50 dark:bg-zinc-800" : ""}>
              <td className="px-4 py-4 border-b font-medium text-zinc-700 dark:text-zinc-200">{row.feature}</td>
              {row.values.map((value, i) => (
                <td
                  key={plans[i]}
                  className="px-4 py-4 border-b text-center"
                >
                  {idx === 0 ? (
                    <span
                      className={
                        value === "Unlimited"
                          ? "text-green-600 dark:text-green-400 font-medium"
                          : "text-blue-500 dark:text-blue-400 underline font-medium"
                      }
                    >
                      {value}
                    </span>
                  ) : value === true ? (
                    <CheckCircle2 className="w-6 h-6 mx-auto text-green-500" aria-label="Yes" />
                  ) : (
                    <XCircle className="w-6 h-6 mx-auto text-red-400" aria-label="No" />
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </section>
);

export default PlanComparisonTable;
