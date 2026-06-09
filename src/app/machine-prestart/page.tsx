"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Send } from "lucide-react";
import { RequireAuth } from "@/components/RequireAuth";
import { Button, Card, Input, PageTitle, Select, Textarea } from "@/components/ui";
import { todayBrisbaneIso } from "@/lib/dates";
import { supabase } from "@/lib/supabase";
import type { Machine, Profile } from "@/lib/types";

const checks = [
  ["safe_to_operate", "Machine is safe to operate"],
  ["fluids_checked", "Fluids have been checked"],
  ["tyres_tracks_checked", "Tyres/tracks are visually checked"],
  ["guards_checked", "Guards and safety devices are checked"],
  ["brakes_steering_checked", "Brakes and steering are checked"],
  ["faults_reported", "Faults or damage have been reported"]
] as const;

type CheckKey = (typeof checks)[number][0];

export default function MachinePrestartPage() {
  return (
    <Suspense fallback={<div className="p-4 text-sm font-semibold text-steel">Loading...</div>}>
      <RequireAuth role="employee">{(profile) => <MachinePrestartInner profile={profile} />}</RequireAuth>
    </Suspense>
  );
}

function MachinePrestartInner({ profile }: { profile: Profile }) {
  const searchParams = useSearchParams();
  const machineIdParam = searchParams.get("machineId") ?? "";
  const [machines, setMachines] = useState<Machine[]>([]);
  const [machineId, setMachineId] = useState(machineIdParam);
  const [checked, setChecked] = useState<Record<CheckKey, boolean>>({
    safe_to_operate: false,
    fluids_checked: false,
    tyres_tracks_checked: false,
    guards_checked: false,
    brakes_steering_checked: false,
    faults_reported: false
  });
  const [startMeter, setStartMeter] = useState("");
  const [finishMeter, setFinishMeter] = useState("");
  const [comments, setComments] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const allChecked = Object.values(checked).every(Boolean);
  const machineHours = useMemo(() => {
    const start = Number(startMeter);
    const finish = Number(finishMeter);
    if (Number.isNaN(start) || Number.isNaN(finish) || finish < start) return null;
    return Math.round((finish - start) * 100) / 100;
  }, [startMeter, finishMeter]);

  useEffect(() => {
    supabase
      .from("machines")
      .select("*, workplaces(name)")
      .eq("active", true)
      .order("name")
      .then(({ data }) => {
        const rows = (data ?? []) as Machine[];
        setMachines(rows);
        setMachineId((current) => current || rows[0]?.id || "");
      });
  }, []);

  async function submit() {
    const start = Number(startMeter);
    const finish = finishMeter === "" ? null : Number(finishMeter);
    if (!machineId || !allChecked || Number.isNaN(start) || start < 0) {
      setMessage("Choose a machine, complete every check, and enter the start hour meter.");
      return;
    }
    if (finish !== null && (Number.isNaN(finish) || finish < start)) {
      setMessage("Finish hour meter must be equal to or higher than the start meter.");
      return;
    }

    setBusy(true);
    const { error } = await supabase.from("machine_prestarts").insert({
      machine_id: machineId,
      employee_id: profile.id,
      date: todayBrisbaneIso(),
      ...checked,
      start_hour_meter: start,
      finish_hour_meter: finish,
      machine_hours: finish === null ? null : Math.round((finish - start) * 100) / 100,
      comments: comments.trim() || null
    });
    setBusy(false);

    if (error) setMessage(error.message);
    else {
      setMessage("Machine pre-start saved.");
      setStartMeter("");
      setFinishMeter("");
      setComments("");
      setChecked({
        safe_to_operate: false,
        fluids_checked: false,
        tyres_tracks_checked: false,
        guards_checked: false,
        brakes_steering_checked: false,
        faults_reported: false
      });
    }
  }

  return (
    <>
      <PageTitle title="Machine Pre-start" subtitle="Scan the machine QR code, complete checks, and record hour meter readings." />
      <Card>
        <div className="space-y-4">
          <label className="block text-sm font-semibold">
            Machine
            <Select value={machineId} onChange={(event) => setMachineId(event.target.value)}>
              {machines.map((machine) => (
                <option key={machine.id} value={machine.id}>
                  {machine.name}{machine.asset_number ? ` - ${machine.asset_number}` : ""}
                </option>
              ))}
            </Select>
          </label>
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
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-semibold">
              Start hour meter
              <Input type="number" min="0" step="0.1" value={startMeter} onChange={(event) => setStartMeter(event.target.value)} />
            </label>
            <label className="text-sm font-semibold">
              Finish hour meter
              <Input type="number" min="0" step="0.1" value={finishMeter} onChange={(event) => setFinishMeter(event.target.value)} />
            </label>
          </div>
          {machineHours !== null ? <p className="rounded-md bg-field/10 p-3 text-sm font-bold text-field">Machine hours: {machineHours}</p> : null}
          <label className="text-sm font-semibold">
            Comments or faults
            <Textarea value={comments} onChange={(event) => setComments(event.target.value)} />
          </label>
          {message ? <p className="rounded-md bg-safety/25 p-3 text-sm font-semibold">{message}</p> : null}
          <Button className="w-full bg-ink text-white" disabled={busy} onClick={submit}>
            <Send size={18} />
            Submit machine pre-start
          </Button>
        </div>
      </Card>
    </>
  );
}
