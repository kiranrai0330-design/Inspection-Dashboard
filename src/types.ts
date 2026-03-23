export interface DriverDayData {
  miles: number;
  vehicles: Set<string>;
  inspections: number;
}

export interface DriverData {
  id: string;
  name: string;
  email: string;
  groups: string;
  days: Record<string, DriverDayData>;
}

export interface KPIStats {
  missing: number;
  partial: number;
  compliant: number;
  score: number;
}

export interface GeotabGroup {
  id: string;
  name: string;
}
