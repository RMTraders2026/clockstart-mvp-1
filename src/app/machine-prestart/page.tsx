"use client";

import { Suspense, useEffect, useState } from "react";
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
  const [hourMeter, setHourMeter] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [comments, setComments] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const allChecked = Object.values(checked).every(Boolean);

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

  async function uploadPhoto() {
    if (!photo) return null;
    const extension = photo.name.split(".").pop() || "jpg";
    const filePath = `${profile.id}/${Date.now()}.${extension}`;
    const { error } = await supabase.storage.from("machine-prestart-photos").upload(filePath, photo);
    if (error) throw error;
    const { data } = supabase.storage.from("machine-prestart-photos").getPublicUrl(filePath);
    return data.publicUrl;
  }

  async function submit() {
    const meter = Number(hourMeter);
    if (!machineId || !allChecked || Number.isNaN(meter) || meter < 0) {
      setMessage("Choose a machine, complete every check, and enter the hour meter.");
      return;
    }

    setBusy(true);
    let photoUrl: string | null = null;
    try {
      photoUrl = await uploadPhoto();
    } catch (error) {
      setBusy(false);
      setMessage(error instanceof Error ? error.message : "Photo upload failed.");
      return;
    }

    const { error } = await supabase.from("machine_prestarts").insert({
      machine_id: machineId,
      employee_id: profile.id,
      date: todayBrisbaneIso(),
      ...checked,
      hour_meter: meter,
      start_hour_meter: meter,
      finish_hour_meter: null,
      machine_hours: null,
      photo_url: photoUrl,
      comments: comments.trim() || null
    });
    setBusy(false);

    if (error) setMessage(error.message);
    else {
      setMessage("Machine pre-start saved.");
      setHourMeter("");
      setPhoto(null);
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
      <PageTitle title="Machine Pre-start" subtitle="Scan the machine QR code, complete checks, and record the hour meter." />
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
          <label className="text-sm font-semibold">
            Hour meter
            <Input type="number" min="0" step="0.1" value={hourMeter} onChange={(event) => setHourMeter(event.target.value)} />
          </label>
          <label className="block text-sm font-semibold">
            Photo
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(event) => setPhoto(event.target.files?.[0] ?? null)}
              className="focus-ring mt-1 w-full rounded-md border border-black/15 bg-white px-3 py-3"
            />
          </label>
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
