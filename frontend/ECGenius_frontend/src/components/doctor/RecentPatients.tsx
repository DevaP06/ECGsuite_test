import { useNavigate } from "react-router-dom";

export default function RecentPatients() {
  const navigate = useNavigate();

  const patients = [
    { id: "p1", name: "John Smith", age: 58, gender: "Male", lastVisit: "2025-10-15" },
    { id: "p2", name: "Mary Johnson", age: 64, gender: "Female", lastVisit: "2025-10-14" },
    { id: "p3", name: "Ali Khan", age: 45, gender: "Male", lastVisit: "2025-10-12" },
  ];

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4">Recent Patients</h3>
      <ul className="divide-y divide-gray-200">
        {patients.map((p) => (
          <li
            key={p.id}
            className="py-3 flex justify-between text-sm cursor-pointer hover:bg-gray-50"
            onClick={() => navigate(`/patients/${p.id}`)}
          >
            <span>
              {p.name} <span className="text-gray-500">({p.age}, {p.gender})</span>
            </span>
            <span className="text-gray-400">{p.lastVisit}</span>
          </li>
        ))}
      </ul>
      <button
        onClick={() => navigate("/patients")}
        className="mt-4 text-blue-600 text-sm font-medium hover:underline"
      >
        View All
      </button>
    </div>
  );
}
