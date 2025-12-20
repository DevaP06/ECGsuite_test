interface Props {
  name: string;
  age: number;
  gender: string;
  lastVisit: string;
}

export default function PatientHeader({ name, age, gender, lastVisit }: Props) {
  return (
    <div className="bg-white shadow rounded-lg p-6 flex justify-between items-center">
      <div>
        <h2 className="text-xl font-bold">{name}</h2>
        <p className="text-gray-500">{age} yrs • {gender}</p>
      </div>
      <p className="text-sm text-gray-400">Last Visit: {lastVisit}</p>
    </div>
  );
}
