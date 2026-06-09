"use client";

import { useEffect, useState } from "react";
import { EllipsisVertical, Save } from "lucide-react";
import { RequireAuth } from "@/components/RequireAuth";
import { Button, Card, Input, PageTitle, Select, StatusPill, Textarea } from "@/components/ui";
import { logAudit } from "@/lib/admin";
import { formatDateTime } from "@/lib/dates";
import { supabase } from "@/lib/supabase";
import type { Profile, Timesheet, TimesheetStatus, Workplace } from "@/lib/types";

export default function AdminTimesheetsPage() {
  return <RequireAuth role="admin">{(profile) => <AdminTimesheets profile={profile} />}</RequireAuth>;
}

function AdminTimesheets({ profile }: { profile: Profile }) {
  const [rows, setRows] = useState<Timesheet[]>([]);
  const [employees, setEmployees] = useState<Profile[]>([]);
  const [workplaces, setWorkplaces] = useState<Workplace[]>([]);
  const [date, setDate] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [workplaceId, setWorkplaceId] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    let query = supabase
      .from("timesheets")
      .select("*, profiles(full_name,email), workplaces(name,address)")
      .order("date", { ascending: false })
      .order("clock_in_time", { ascending: false });
    if (date) query = query.eq("date", date);
    if (employeeId) query = query.eq("employee_id", employeeId);
    if (workplaceId) query = query.eq("workplace_id", workplaceId);
    const { data } = await query;
    setRows((data ?? []) as Timesheet[]);
  }

  useEffect(() => {
    supabase.from("profiles").select("*").order("full_name").then(({ data }) => setEmployees((data ?? []) as Profile[]));
    supabase.from("workplaces").select("*").order("name").then(({ data }) => setWorkplaces((data ?? []) as Workplace[]));
  }, []);

  useEffect(() => {
    load();
  }, [date, employeeId, workplaceId]);

  async function setStatus(row: Timesheet, status: TimesheetStatus) {
    const { error } = await supabase.from("timesheets").update({ status }).eq("id", row.id);
    if (!error) {
      await logAudit(profile.id, `timesheet_${status}`, "timesheets", row.id, { status: row.status }, { status });
      await load();
    }
  }

  async function correct(row: Timesheet, breakMinutes: string, notes: string) {
    const parsedBreak = Number(breakMinutes);
    if (Number.isNaN(parsedBreak) || parsedBreak < 0) {
      setMessage("Break minutes must be 0 or more.");
      return;
    }
    const oldValue = { break_minutes: row.break_minutes, work_notes: row.work_notes };
    const newValue = { break_minutes: parsedBreak, work_notes: notes };
    const { error } = await supabase.from("timesheets").update(newValue).eq("id", row.id);
    if (error) setMessage(error.message);
    else {
      await logAudit(profile.id, "admin_correction", "timesheets", row.id, oldValue, newValue);
      setMessage("Correction saved and audit logged.");
      await load();
    }
  }

  return (
    <>
      <PageTitle title="Timesheets" subtitle="Filter, approve, reject, and correct break time or notes." />
      <Card className="mb-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <Input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
          <Select value={employeeId} onChange={(event) => setEmployeeId(event.target.value)}>
            <option value="">All employees</option>
            {employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.full_name}</option>)}
          </Select>
          <Select value={workplaceId} onChange={(event) => setWorkplaceId(event.target.value)}>
            <option value="">All workplaces</option>
            {workplaces.map((site) => <option key={site.id} value={site.id}>{site.name}</option>)}
          </Select>
        </div>
        {message ? <p className="mt-3 rounded-md bg-safety/25 p-3 text-sm font-semibold">{message}</p> : null}
      </Card>
      <div className="space-y-3">
        {rows.map((row) => <TimesheetCard key={row.id} row={row} onStatus={setStatus} onCorrect={correct} />)}
        {!rows.length ? <Card>No timesheets match these filters.</Card> : null}
      </div>
    </>
  );
}

function TimesheetCard({
  row,
  onStatus,
  onCorrect
}: {
  row: Timesheet;
  onStatus: (row: Timesheet, status: TimesheetStatus) => void;
  onCorrect: (row: Timesheet, breakMinutes: string, notes: string) => void;
}) {
  const [breakMinutes, setBreakMinutes] = useState(String(row.break_minutes ?? 0));
  const [notes, setNotes] = useState(row.work_notes ?? "");
  const [showActions, setShowActions] = useState(row.status === "submitted");

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-bold">{row.profiles?.full_name}</h2>
          <p className="text-sm text-steel">{row.workplaces?.name} - {row.date}</p>
        </div>
        <div className="flex items-center gap-2">
          <StatusPill tone={row.status === "approved" ? "good" : row.status === "rejected" ? "bad" : row.status === "submitted" ? "warn" : "neutral"}>{row.status}</StatusPill>
          {row.status !== "submitted" ? (
            <button
              aria-label="Show timesheet actions"
              className="focus-ring rounded-md border border-black/10 bg-white p-2 text-ink"
              onClick={() => setShowActions((current) => !current)}
            >
              <EllipsisVertical size={18} />
            </button>
          ) : null}
        </div>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        <div><dt className="text-steel">In</dt><dd className="font-semibold">{formatDateTime(row.clock_in_time)}</dd></div>
        <div><dt className="text-steel">Out</dt><dd className="font-semibold">{formatDateTime(row.clock_out_time)}</dd></div>
        <div><dt className="text-steel">Hours</dt><dd className="font-semibold">{row.total_hours ?? "-"}</dd></div>
        <div><dt className="text-steel">GPS</dt><dd className="font-semibold">{row.clock_in_outside_radius || row.clock_out_outside_radius ? "Flagged" : "OK"}</dd></div>
      </dl>
      {showActions ? (
        <>
          <div className="mt-4 grid gap-3 sm:grid-cols-[160px_1fr]">
            <label className="text-sm font-semibold">Break minutes<Input type="number" min="0" value={breakMinutes} onChange={(event) => setBreakMinutes(event.target.value)} /></label>
            <label className="text-sm font-semibold">Notes<Textarea value={notes} onChange={(event) => setNotes(event.target.value)} /></label>
          </div>
          <div className="mt-4 grid gap-2 sm:flex">
            <Button className="bg-field text-white" onClick={() => onStatus(row, "approved")}>Approve</Button>
            <Button className="bg-red-700 text-white" onClick={() => onStatus(row, "rejected")}>Reject</Button>
            <Button className="bg-ink text-white" onClick={() => onCorrect(row, breakMinutes, notes)}><Save size={18} />Save correction</Button>
          </div>
        </>
      ) : null}
    </Card>
  );
}
