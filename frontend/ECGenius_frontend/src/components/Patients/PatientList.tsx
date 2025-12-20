import PatientCard from "./PatientCard";

export default function PatientList() {
  const patients = [
    { id: "p1", name: "John Smith", age: 58, gender: "Male", lastVisit: "2025-10-15" },
    { id: "p2", name: "Mary Johnson", age: 64, gender: "Female", lastVisit: "2025-10-14" },
    { id: "p3", name: "Ali Khan", age: 45, gender: "Male", lastVisit: "2025-10-12" },
  ];

  return (
    <div className="bg-white shadow rounded-lg p-4 divide-y">
      {patients.map((p) => (
        <PatientCard key={p.id} patient={p} />
      ))}
    </div>
  );
}
