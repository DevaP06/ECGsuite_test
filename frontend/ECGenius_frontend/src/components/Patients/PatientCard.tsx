import { useNavigate } from "react-router-dom";

interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  lastVisit: string;
}

export default function PatientCard({ patient }: { patient: Patient }) {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/patients/${patient.id}`)}
      className="p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50"
    >
      <div>
        <p className="font-medium">{patient.name}</p>
        <p className="text-sm text-gray-500">
          {patient.age} yrs • {patient.gender}
        </p>
      </div>
      <span className="text-sm text-gray-400">Last visit: {patient.lastVisit}</span>
    </div>
  );
}
