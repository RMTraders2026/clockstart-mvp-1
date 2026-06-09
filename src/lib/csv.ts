import type { Timesheet } from "@/lib/types";
import { formatDateTime } from "@/lib/dates";

function escapeCsv(value: unknown) {
  const text = value == null ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

export function timesheetsToCsv(timesheets: Timesheet[]) {
  const headers = [
    "Employee",
    "Email",
    "Workplace",
    "Date",
    "Clock in",
    "Clock out",
    "Break minutes",
    "Total hours",
    "Status",
    "Clock in outside radius",
    "Clock out outside radius",
    "Notes"
  ];

  const rows = timesheets.map((row) => [
    row.profiles?.full_name,
    row.profiles?.email,
    row.workplaces?.name,
    row.date,
    formatDateTime(row.clock_in_time),
    formatDateTime(row.clock_out_time),
    row.break_minutes,
    row.total_hours,
    row.status,
    row.clock_in_outside_radius ? "Yes" : "No",
    row.clock_out_outside_radius ? "Yes" : "No",
    row.work_notes
  ]);

  return [headers, ...rows].map((row) => row.map(escapeCsv).join(",")).join("\n");
}
