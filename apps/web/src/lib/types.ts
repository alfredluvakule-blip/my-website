/** Shared response/entity shapes returned by the API (read models). */

export interface Paginated<T> {
  data: T[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
}

export interface DashboardSummary {
  cases: { today: number; running: number; completed: number; cancelled: number };
  perfusion: {
    avgCpbTimeMin: number | null;
    avgCrossClampTimeMin: number | null;
    avgAct: number | null;
    avgTemperatureC: number | null;
    avgFlowLmin: number | null;
  };
}

export interface PatientRow {
  id: string;
  hospitalNumber: string;
  name: string;
  age: number | null;
  sex: string;
  weightKg: string;
  heightCm: string;
  bsaM2: string | null;
  bmi: string | null;
  bloodGroup: string;
  diagnosis: string | null;
}

export interface CaseRow {
  id: string;
  procedure: string;
  status: string;
  priority: string;
  scheduledDate: string;
  operatingRoom: string | null;
  cpbTimeMin: number | null;
  crossClampTimeMin: number | null;
  patient?: { id: string; name: string; hospitalNumber: string };
  perfusionist?: { id: string; fullName: string } | null;
}
