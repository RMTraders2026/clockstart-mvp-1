"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock, MapPin, Send } from "lucide-react";
import { RequireAuth } from "@/components/RequireAuth";
import { Button, Card, Input, PageTitle, Select, StatusPill, Textarea } from "@/components/ui";
import { getActiveWorkplaces } from "@/lib/data";
import { supabase } from "@/lib/supabase";
import { calculateHours, formatDateTime, todayBrisbaneIso } from "@/lib/dates";
import { captureLocation, isOutsideWorkplaceRadius } from "@/lib/gps";
import type { Prestart, Profile, Timesheet, Workplace } from "@/lib/types";

const checks = [
  ["fit_for_work", "I am fit for work"],
  ["not_under_influence", "I am not affected by drugs or alcohol"],
  ["ppe_available", "I have the required PPE"],
  ["hazards_understood", "I understand today's work area and hazards"],
  ["site_rules_acknowledged", "I will follow site rules, SWMS, and WHS directions"],
  ["report_issues_acknowledged", "I will report hazards, incidents, injuries, or unsafe conditions"],
  ["authorised_equipment_acknowledged", "I understand I must only operate equipment I am licensed or authorised to use"]
] as const;

type CheckKey = (typeof checks)[number][0];

function TodayInner({ profile }: { profile: Profile }) {
  const [workplaces, setWorkplaces] = useState<Workplace[]>([]);
  const [workplaceId, setWorkplaceId] = useState("");
  const [prestart, setPrestart] = useState<Prestart | null>(null);
  const [activeSheet, setActiveSheet] = useState<Timesheet | null>(null);
  const [checked, setChecked] = useState<Record<CheckKey, boolean>>({
    fit_for_work: false,
    not_under_influence: false,
    ppe_available: false,
    hazards_understood: false,
    site_rules_acknowledged: false,
    report_issues_acknowledged: false,
    authorised_equipment_acknowledged: false
  });
  const [signature, setSignature] = useState(profile.full_name);
  const [comments, setComments] = useState("");
  const [breakMinutes, setBreakMinutes] = useState("");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const selectedWorkplace = useMemo(() => workplaces.find((site) => site.id === workplaceId) ?? null, [workplaces, workplaceId]);
  const allChecked = Object.values(checked).every(Boolean);
  const today = todayBrisbaneIso();

  async function refresh() {
    const sites = await getActiveWorkplaces();
    setWorkplaces(sites);
    setWorkplaceId((current) => current || sites[0]?.id || "");

    const { data: active } = await supabase
      .from("timesheets")
      .select("*, workplaces(name,address)")
      .eq("employee_id", profile.id)
      .eq("status", "active")
      .maybeSingle<Timesheet>();
    setActiveSheet(active ?? null);
  }

  async function refreshPrestart(nextWorkplaceId = workplaceId) {
    if (!nextWorkplaceId) return;
    const { data } = await supabase
      .from("prestarts")
      .select("*")
      .eq("employee_id", profile.id)
      .eq("workplace_id", nextWorkplaceId)
      .eq("date", today)
      .maybeSingle<Prestart>();
    setPrestart(data ?? null);
  }

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    refreshPrestart();
  }, [workplaceId]);

  async function submitPrestart() {
    if (!workplaceId || !allChecked || signature.trim().length < 2) {
      setMessage("Complete all pre-start checks and type your name.");
      return;
    }
    setBusy(true);
    const gps = await captureLocation();
    const payload = {
      employee_id: profile.id,
      workplace_id: workplaceId,
      date: today,
      ...checked,
      signature_name: signature.trim(),
      comments: comments.trim() || null,
      gps_latitude: gps?.latitude ?? null,
      gps_longitude: gps?.longitude ?? null,
      gps_accuracy: gps?.accuracy ?? null,
      submitted_at: new Date().toISOString()
    };
    const { error } = await supabase.from("prestarts").insert(payload);
    setBusy(false);
    if (error) setMessage(error.message);
    else {
      setMessage("Pre-start submitted.");
      await refreshPrestart();
    }
  }

  async function clockIn() {
    if (!prestart || !selectedWorkplace) {
      setMessage("Submit today's pre-start for this workplace first.");
      return;
    }
    setBusy(true);
    const gps = await captureLocation();
    const { error } = await supabase.from("timesheets").insert({
      employee_id: profile.id,
      workplace_id: selectedWorkplace.id,
      date: today,
      clock_in_time: new Date().toISOString(),
      clock_in_latitude: gps?.latitude ?? null,
      clock_in_longitude: gps?.longitude ?? null,
      clock_in_accuracy: gps?.accuracy ?? null,
      clock_in_outside_radius: isOutsideWorkplaceRadius(gps, selectedWorkplace),
      status: "active"
    });
    setBusy(false);
    if (error) setMessage(error.message);
    else {
      setMessage("Clocked in.");
      await refresh();
    }
  }

  async function clockOut() {
    const parsedBreak = Number(breakMinutes);
    if (!activeSheet || Number.isNaN(parsedBreak) || parsedBreak < 0 || notes.trim().length < 3) {
      setMessage("Enter break minutes, even 0, and add daily notes before clocking out.");
      return;
    }
    setBusy(true);
    const gps = await captureLocation();
    const site = workplaces.find((workplace) => workplace.id === activeSheet.workplace_id) ?? selectedWorkplace;
    const clockOutTime = new Date().toISOString();
    const { error } = await supabase
      .from("timesheets")
      .update({
        clock_out_time: clockOutTime,
        break_minutes: parsedBreak,
        total_hours: calculateHours(activeSheet.clock_in_time, clockOutTime, parsedBreak),
        work_notes: notes.trim(),
        clock_out_latitude: gps?.latitude ?? null,
        clock_out_longitude: gps?.longitude ?? null,
        clock_out_accuracy: gps?.accuracy ?? null,
        clock_out_outside_radius: isOutsideWorkplaceRadius(gps, site),
        status: "submitted"
      })
      .eq("id", activeSheet.id);
    setBusy(false);
    if (error) setMessage(error.message);
    else {
      setMessage("Clocked out and submitted for review.");
      setBreakMinutes("");
      setNotes("");
      await refresh();
    }
  }

  return (
    <>
      <PageTitle title="Today" subtitle="Complete your pre-start, clock in, then submit notes when you clock out." />
      <div className="grid gap-4 lg:grid-cols-[1fr_0.8fr]">
        <Card>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold">Workplace</h2>
            {activeSheet ? <StatusPill tone="good">Clocked in</StatusPill> : <StatusPill>Not clocked in</StatusPill>}
          </div>
          <Select value={workplaceId} disabled={!!activeSheet} onChange={(event) => setWorkplaceId(event.target.value)}>
            {workplaces.map((site) => (
              <option key={site.id} value={site.id}>
                {site.name}
              </option>
            ))}
          </Select>
          {selectedWorkplace?.address ? <p className="mt-2 text-sm text-steel">{selectedWorkplace.address}</p> : null}
        </Card>

        <Card>
          <h2 className="mb-3 text-lg font-bold">Status</h2>
          <div className="space-y-2 text-sm">
            <p>Today: {today}</p>
            <p>Pre-start: {prestart ? "Submitted" : "Required"}</p>
            <p>Clock in: {formatDateTime(activeSheet?.clock_in_time ?? null)}</p>
          </div>
          {message ? <p className="mt-3 rounded-md bg-safety/25 p-3 text-sm font-semibold">{message}</p> : null}
        </Card>
      </div>

      {!prestart && !activeSheet ? (
        <Card className="mt-4">
          <h2 className="mb-3 text-lg font-bold">Daily Pre-start</h2>
          <div className="space-y-3">
            {checks.map(([key, label]) => (
              <label key={key} className="flex items-start gap-3 rounded-md border border-black/10 p-3 text-sm font-semibold">
                <input
                  type="checkbox"
                  className="mt-1 h-5 w-5"
                  checked={checked[key]}
                  onChange={(event) => setChecked((current) => ({ ...current, [key]: event.target.checked }))}
                />
                <span>{label}</span>
              </label>
            ))}
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-semibold">
              Digital signature
              <Input value={signature} onChange={(event) => setSignature(event.target.value)} />
            </label>
            <label className="text-sm font-semibold sm:col-span-2">
              Comments
              <Textarea value={comments} onChange={(event) => setComments(event.target.value)} />
            </label>
          </div>
          <Button onClick={submitPrestart} disabled={busy} className="mt-4 w-full bg-ink text-white">
            <Send size={18} />
            Submit pre-start
          </Button>
        </Card>
      ) : null}

      <Card className="mt-4">
        {!activeSheet ? (
          <Button onClick={clockIn} disabled={busy || !prestart} className="w-full bg-field py-5 text-lg text-white">
            <MapPin size={22} />
            Clock in
          </Button>
        ) : (
          <div className="space-y-4">
            <div className="rounded-md bg-field/10 p-3 text-sm font-semibold text-field">
              <CheckCircle2 className="mr-2 inline" size={18} />
              You are clocked in from {formatDateTime(activeSheet.clock_in_time)}.
            </div>
            <label className="text-sm font-semibold">
              Break minutes
              <Input type="number" min="0" value={breakMinutes} onChange={(event) => setBreakMinutes(event.target.value)} />
            </label>
            <label className="text-sm font-semibold">
              What did today involve?
              <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} />
            </label>
            {breakMinutes !== "" ? (
              <p className="text-sm font-bold">Calculated hours: {calculateHours(activeSheet.clock_in_time, new Date().toISOString(), Number(breakMinutes))}</p>
            ) : null}
            <Button onClick={clockOut} disabled={busy} className="w-full bg-clay py-5 text-lg text-white">
              <Clock size={22} />
              Clock out
            </Button>
          </div>
        )}
      </Card>
    </>
  );
}

export default function TodayPage() {
  return <RequireAuth role="employee">{(profile) => <TodayInner profile={profile} />}</RequireAuth>;
}
