export type Role = "employee" | "admin";
export type TimesheetStatus = "active" | "submitted" | "approved" | "rejected";

export type Profile = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  job_role: string | null;
  role: Role;
  active: boolean;
  created_at: string;
};

export type Workplace = {
  id: string;
  name: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  allowed_radius_meters: number | null;
  active: boolean;
  created_at: string;
};

export type Prestart = {
  id: string;
  employee_id: string;
  workplace_id: string;
  date: string;
  fit_for_work: boolean;
  not_under_influence: boolean;
  ppe_available: boolean;
  hazards_understood: boolean;
  site_rules_acknowledged: boolean;
  report_issues_acknowledged: boolean;
  authorised_equipment_acknowledged: boolean;
  signature_name: string;
  comments: string | null;
  gps_latitude: number | null;
  gps_longitude: number | null;
  gps_accuracy: number | null;
  submitted_at: string;
};

export type PrestartItem = {
  id: string;
  label: string;
  sort_order: number;
  active: boolean;
  created_at: string;
};

export type PrestartItemResponse = {
  id: string;
  prestart_id: string;
  prestart_item_id: string;
  checked: boolean;
  created_at: string;
};

export type Timesheet = {
  id: string;
  employee_id: string;
  workplace_id: string;
  date: string;
  clock_in_time: string;
  clock_out_time: string | null;
  break_minutes: number | null;
  total_hours: number | null;
  work_notes: string | null;
  clock_in_latitude: number | null;
  clock_in_longitude: number | null;
  clock_in_accuracy: number | null;
  clock_out_latitude: number | null;
  clock_out_longitude: number | null;
  clock_out_accuracy: number | null;
  clock_in_outside_radius: boolean | null;
  clock_out_outside_radius: boolean | null;
  status: TimesheetStatus;
  created_at: string;
  updated_at: string;
  profiles?: Pick<Profile, "full_name" | "email"> | null;
  workplaces?: Pick<Workplace, "name" | "address"> | null;
};

export type Machine = {
  id: string;
  name: string;
  asset_number: string | null;
  workplace_id: string | null;
  active: boolean;
  created_at: string;
  workplaces?: Pick<Workplace, "name"> | null;
};

export type MachinePrestart = {
  id: string;
  machine_id: string;
  employee_id: string;
  date: string;
  safe_to_operate: boolean;
  fluids_checked: boolean;
  tyres_tracks_checked: boolean;
  guards_checked: boolean;
  brakes_steering_checked: boolean;
  faults_reported: boolean;
  safe_to_operate_status: string | null;
  fluids_checked_status: string | null;
  tyres_tracks_checked_status: string | null;
  guards_checked_status: string | null;
  brakes_steering_checked_status: string | null;
  faults_reported_status: string | null;
  hour_meter: number | null;
  start_hour_meter: number;
  finish_hour_meter: number | null;
  machine_hours: number | null;
  photo_url: string | null;
  comments: string | null;
  submitted_at: string;
  profiles?: Pick<Profile, "full_name" | "email"> | null;
  machines?: Pick<Machine, "name" | "asset_number"> | null;
};

export type GpsPoint = {
  latitude: number;
  longitude: number;
  accuracy: number;
  capturedAt: string;
};
