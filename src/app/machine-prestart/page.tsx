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
type CheckStatus = "satisfactory" | "unsatisfactory" | "na";

const statusOptions: Array<{ value: CheckStatus; label: string }> = [
  { value: "satisfactory", label: "Satisfactory" },
  { value: "unsatisfactory", label: "Unsatisfactory" },
  { value: "na", label: "N/A" }
];

const emptyStatuses: Record<CheckKey, CheckStatus | ""> = {
  safe_to_operate: "",
  fluids_checked: "",
  tyres_tracks_checked: "",
  guards_checked: "",
  brakes_steering_checked: "",
  faults_reported: ""
};

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
  const [statuses, setStatuses] = useState<Record<CheckKey, CheckStatus | "">>(emptyStatuses);
  const [hourMeter, setHourMeter] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [comments, setComments] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const allChecked = Object.values(statuses).every(Boolean);

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
    const meter = hourMeter === "" ? null : Number(hourMeter);
    if (!machineId || !allChecked) {
      setMessage("Choose a machine and complete every checklist item.");
      return;
    }
    if (meter !== null && (Number.isNaN(meter) || meter < 0)) {
      setMessage("Hour meter must be 0 or more.");
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
      safe_to_operate: statuses.safe_to_operate !== "unsatisfactory",
      fluids_checked: statuses.fluids_checked !== "unsatisfactory",
      tyres_tracks_checked: statuses.tyres_tracks_checked !== "unsatisfactory",
      guards_checked: statuses.guards_checked !== "unsatisfactory",
      brakes_steering_checked: statuses.brakes_steering_checked !== "unsatisfactory",
      faults_reported: statuses.faults_reported !== "unsatisfactory",
      safe_to_operate_status: statuses.safe_to_operate,
      fluids_checked_status: statuses.fluids_checked,
      tyres_tracks_checked_status: statuses.tyres_tracks_checked,
      guards_checked_status: statuses.guards_checked,
      brakes_steering_checked_status: statuses.brakes_steering_checked,
      faults_reported_status: statuses.faults_reported,
      hour_meter: meter,
      start_hour_meter: meter ?? 0,
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
      setStatuses(emptyStatuses);
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
              <div key={key} className="rounded-md border border-black/10 p-3">
                <p className="text-sm font-bold">{label}</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  {statusOptions.map((option) => {
                    const selected = statuses[key] === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        className={`focus-ring min-h-11 rounded-md border px-3 text-sm font-bold ${
                          selected ? "border-field bg-field text-white" : "border-black/10 bg-white text-ink"
                        }`}
                        onClick={() => setStatuses((current) => ({ ...current, [key]: option.value }))}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <label className="text-sm font-semibold">
            Hour meter
            <Input type="number" min="0" step="0.1" value={hourMeter} onChange={(event) => setHourMeter(event.target.value)} />
          </label>
          <label className="block text-sm font-semibold">
            Take photo or choose from photo library
            <input
              type="file"
              accept="image/*"
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
