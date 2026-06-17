import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchPatients } from "../../features/patient/patientService";
import type { Patient } from "../../features/patient/patientService";

export default function PatientsTable() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"name" | "age" | "lastVisit">("lastVisit");
  const [dir, setDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 5;

  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    fetchPatients({ q, sort, dir, page, pageSize }).then((res) => {
      setPatients(res.data);
      setTotal(res.total);
      setLoading(false);
    });
  }, [q, sort, dir, page]);

  if (loading) {
    return <div className="bg-white shadow rounded-lg p-6 animate-pulse h-64" />;
  }

  if (!patients.length) {
    return (
      <div className="bg-white shadow rounded-lg p-6 text-center">
        <p className="text-gray-600">No patients found</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      {/* Controls */}
      <div className="flex items-center gap-4 mb-4">
        <input
          type="text"
          placeholder="Search patients..."
          className="border px-3 py-2 rounded text-sm"
          onChange={(e) => {
            const val = e.target.value;
            setPage(1);
            setTimeout(() => setQ(val), 300); // debounce
          }}
        />
        <select
          className="border px-2 py-2 rounded text-sm"
          value={`${sort}:${dir}`}
          onChange={(e) => {
            const [s, d] = e.target.value.split(":") as ["name" | "age" | "lastVisit", "asc" | "desc"];
            setSort(s);
            setDir(d);
          }}
        >
          <option value="lastVisit:desc">Last Visit ↓</option>
          <option value="lastVisit:asc">Last Visit ↑</option>
          <option value="name:asc">Name A→Z</option>
          <option value="name:desc">Name Z→A</option>
          <option value="age:asc">Age ↑</option>
          <option value="age:desc">Age ↓</option>
        </select>
      </div>

      {/* Table */}
      <table className="w-full text-sm">
        <thead>
          <tr className="text-gray-500 text-left">
            <th className="pb-2">Name</th>
            <th className="pb-2">Age</th>
            <th className="pb-2">Gender</th>
            <th className="pb-2">Last Visit</th>
          </tr>
        </thead>
        <tbody>
          {patients.map((p) => (
            <tr
              key={p.id}
              className="border-t hover:bg-gray-50 cursor-pointer"
              onClick={() => navigate(`/patients/${p.id}`)}
            >
              <td className="py-2">{p.name}</td>
              <td className="py-2">{p.age}</td>
              <td className="py-2">{p.gender}</td>
              <td className="py-2">{p.lastVisit}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-4">
        <p className="text-xs text-gray-500">
          Page {page} of {Math.ceil(total / pageSize)} ({total} patients)
        </p>
        <div className="flex gap-2">
          <button
            className="px-3 py-1 border rounded disabled:opacity-50"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Prev
          </button>
          <button
            className="px-3 py-1 border rounded disabled:opacity-50"
            disabled={page >= Math.ceil(total / pageSize)}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
