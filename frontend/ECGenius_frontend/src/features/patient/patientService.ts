export type Patient = {
  id: string;
  name: string;
  age: number;
  gender: string;
  lastVisit: string;
};

export type PatientQuery = {
  q?: string;
  sort?: "name" | "age" | "lastVisit";
  dir?: "asc" | "desc";
  page?: number;
  pageSize?: number;
};

const MOCK: Patient[] = [
  { id: "p1", name: "John Smith", age: 58, gender: "Male", lastVisit: "2025-10-15" },
  { id: "p2", name: "Mary Johnson", age: 64, gender: "Female", lastVisit: "2025-10-14" },
  { id: "p3", name: "Ali Khan", age: 45, gender: "Male", lastVisit: "2025-10-12" },
  // ... add more mock patients
];

export async function fetchPatients(params: PatientQuery): Promise<{ data: Patient[]; total: number }> {
  await new Promise((res) => setTimeout(res, 300)); // simulate network delay
  let data = [...MOCK];

  if (params.q) {
    data = data.filter((p) => p.name.toLowerCase().includes(params.q!.toLowerCase()));
  }
  if (params.sort) {
    data.sort((a: any, b: any) => {
      if (a[params.sort!] < b[params.sort!]) return params.dir === "desc" ? 1 : -1;
      if (a[params.sort!] > b[params.sort!]) return params.dir === "desc" ? -1 : 1;
      return 0;
    });
  }
  const total = data.length;
  const start = ((params.page ?? 1) - 1) * (params.pageSize ?? 10);
  const end = start + (params.pageSize ?? 10);
  return { data: data.slice(start, end), total };
}
