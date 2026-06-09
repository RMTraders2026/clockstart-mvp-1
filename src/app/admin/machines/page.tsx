"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Plus, QrCode, Save } from "lucide-react";
import { RequireAuth } from "@/components/RequireAuth";
import { Button, Card, Input, PageTitle, Select, StatusPill } from "@/components/ui";
import { absoluteAppUrl, qrImageUrl } from "@/lib/qr";
import { supabase } from "@/lib/supabase";
import type { Machine, MachinePrestart, Workplace } from "@/lib/types";

function machinePrestartsToCsv(rows: MachinePrestart[]) {
  const headers = ["Date", "Machine", "Asset", "Employee", "Hour meter", "Photo", "Comments"];
  const escapeCsv = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  const data = rows.map((row) => [
    row.date,
    row.machines?.name,
    row.machines?.asset_number,
    row.profiles?.full_name,
    row.hour_meter ?? row.start_hour_meter,
    row.photo_url,
    row.comments
  ]);
  return [headers, ...data].map((row) => row.map(escapeCsv).join(",")).join("\n");
}

export default function MachinesPage() {
  return (
    <RequireAuth role="admin">
      {() => <Machines />}
    </RequireAuth>
  );
}

function Machines() {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [workplaces, setWorkplaces] = useState<Workplace[]>([]);
  const [form, setForm] = useState({ name: "", asset_number: "", workplace_id: "" });
  const [message, setMessage] = useState("");
  const [exportStart, setExportStart] = useState("");
  const [exportEnd, setExportEnd] = useState("");

  const officeQrUrl = useMemo(() => absoluteAppUrl("/today"), []);

  async function load() {
    const [{ data: machineData }, { data: workplaceData }] = await Promise.all([
      supabase.from("machines").select("*, workplaces(name)").order("name"),
      supabase.from("workplaces").select("*").eq("active", true).order("name")
    ]);
    setMachines((machineData ?? []) as Machine[]);
    setWorkplaces((workplaceData ?? []) as Workplace[]);
    setForm((current) => ({ ...current, workplace_id: current.workplace_id || workplaceData?.[0]?.id || "" }));
  }

  useEffect(() => {
    load();
  }, []);

  async function addMachine() {
    if (!form.name) {
      setMessage("Enter a machine name.");
      return;
    }
    const { error } = await supabase.from("machines").insert({
      name: form.name,
      asset_number: form.asset_number || null,
      workplace_id: form.workplace_id || null,
      active: true
    });
    if (error) setMessage(error.message);
    else {
      setForm({ name: "", asset_number: "", workplace_id: workplaces[0]?.id ?? "" });
      setMessage("Machine added.");
      await load();
    }
  }

  async function updateMachine(id: string, changes: Partial<Machine>) {
    const { error } = await supabase.from("machines").update(changes).eq("id", id);
    if (error) setMessage(error.message);
    else {
      setMessage("Machine updated.");
      await load();
    }
  }

  async function exportMachineCsv() {
    if (!exportStart || !exportEnd) {
      setMessage("Choose export start and end dates.");
      return;
    }
    const { data, error } = await supabase
      .from("machine_prestarts")
      .select("*, profiles(full_name,email), machines(name,asset_number)")
      .gte("date", exportStart)
      .lte("date", exportEnd)
      .order("date", { ascending: true });

    if (error) {
      setMessage(error.message);
      return;
    }

    const blob = new Blob([machinePrestartsToCsv((data ?? []) as MachinePrestart[])], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `machine-hours-${exportStart}-to-${exportEnd}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <PageTitle title="Machines and QR Codes" subtitle="Create machine QR pre-start links and office clock-in QR codes." />
      <div className="mb-4 grid gap-4 lg:grid-cols-[1fr_0.7fr]">
        <Card>
          <h2 className="mb-3 text-lg font-bold">Add Machine</h2>
          <div className="grid gap-3 sm:grid-cols-[1fr_160px_1fr_auto]">
            <Input placeholder="Machine name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
            <Input placeholder="Asset number" value={form.asset_number} onChange={(event) => setForm({ ...form, asset_number: event.target.value })} />
            <Select value={form.workplace_id} onChange={(event) => setForm({ ...form, workplace_id: event.target.value })}>
              {workplaces.map((site) => <option key={site.id} value={site.id}>{site.name}</option>)}
            </Select>
            <Button className="bg-ink text-white" onClick={addMachine}><Plus size={18} />Add</Button>
          </div>
          {message ? <p className="mt-3 rounded-md bg-safety/25 p-3 text-sm font-semibold">{message}</p> : null}
        </Card>
        <Card>
          <h2 className="mb-3 text-lg font-bold">Office Clock-in QR</h2>
          <img src={qrImageUrl(officeQrUrl)} alt="Office clock-in QR code" className="h-36 w-36 rounded-md border border-black/10" />
          <p className="mt-2 break-all text-xs text-steel">{officeQrUrl}</p>
        </Card>
      </div>

      <Card className="mb-4">
        <h2 className="mb-3 text-lg font-bold">Export Machine Hours</h2>
        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <Input type="date" value={exportStart} onChange={(event) => setExportStart(event.target.value)} />
          <Input type="date" value={exportEnd} onChange={(event) => setExportEnd(event.target.value)} />
          <Button className="bg-field text-white" onClick={exportMachineCsv}><Download size={18} />Export CSV</Button>
        </div>
      </Card>

      <div className="space-y-3">
        {machines.map((machine) => (
          <MachineRow key={machine.id} machine={machine} workplaces={workplaces} onUpdate={updateMachine} />
        ))}
        {!machines.length ? <Card>No machines yet.</Card> : null}
      </div>
    </>
  );
}

function MachineRow({
  machine,
  workplaces,
  onUpdate
}: {
  machine: Machine;
  workplaces: Workplace[];
  onUpdate: (id: string, changes: Partial<Machine>) => void;
}) {
  const [name, setName] = useState(machine.name);
  const [assetNumber, setAssetNumber] = useState(machine.asset_number ?? "");
  const [workplaceId, setWorkplaceId] = useState(machine.workplace_id ?? "");
  const machineUrl = absoluteAppUrl(`/machine-prestart?machineId=${machine.id}`);

  return (
    <Card>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="font-bold">{machine.name}</p>
          <p className="text-sm text-steel">{machine.asset_number || "No asset number"} - {machine.workplaces?.name ?? "No site"}</p>
        </div>
        <StatusPill tone={machine.active ? "good" : "neutral"}>{machine.active ? "Active" : "Inactive"}</StatusPill>
      </div>
      <div className="grid gap-4 lg:grid-cols-[1fr_240px]">
        <div className="grid gap-3 sm:grid-cols-[1fr_160px_1fr_auto_auto]">
          <Input value={name} onChange={(event) => setName(event.target.value)} />
          <Input value={assetNumber} onChange={(event) => setAssetNumber(event.target.value)} />
          <Select value={workplaceId} onChange={(event) => setWorkplaceId(event.target.value)}>
            <option value="">No site</option>
            {workplaces.map((site) => <option key={site.id} value={site.id}>{site.name}</option>)}
          </Select>
          <Button className="bg-field text-white" onClick={() => onUpdate(machine.id, {
            name,
            asset_number: assetNumber || null,
            workplace_id: workplaceId || null
          })}><Save size={18} />Save</Button>
          <Button className="bg-black/10 text-ink" onClick={() => onUpdate(machine.id, { active: !machine.active })}>
            {machine.active ? "Deactivate" : "Activate"}
          </Button>
        </div>
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-bold"><QrCode size={18} />Machine QR</div>
          <img src={qrImageUrl(machineUrl)} alt={`${machine.name} QR code`} className="h-36 w-36 rounded-md border border-black/10" />
          <p className="mt-2 break-all text-xs text-steel">{machineUrl}</p>
        </div>
      </div>
    </Card>
  );
}
