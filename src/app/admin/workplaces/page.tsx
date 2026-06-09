"use client";

import { useEffect, useState } from "react";
import { Plus, Save } from "lucide-react";
import { RequireAuth } from "@/components/RequireAuth";
import { Button, Card, Input, PageTitle, StatusPill } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import type { Workplace } from "@/lib/types";

export default function WorkplacesPage() {
  return (
    <RequireAuth role="admin">
      {() => <Workplaces />}
    </RequireAuth>
  );
}

function Workplaces() {
  const [rows, setRows] = useState<Workplace[]>([]);
  const [form, setForm] = useState({ name: "", address: "", latitude: "", longitude: "", radius: "200" });
  const [message, setMessage] = useState("");

  async function load() {
    const { data } = await supabase.from("workplaces").select("*").order("name");
    setRows((data ?? []) as Workplace[]);
  }

  useEffect(() => {
    load();
  }, []);

  async function addWorkplace() {
    const { error } = await supabase.from("workplaces").insert({
      name: form.name,
      address: form.address || null,
      latitude: form.latitude ? Number(form.latitude) : null,
      longitude: form.longitude ? Number(form.longitude) : null,
      allowed_radius_meters: form.radius ? Number(form.radius) : null,
      active: true
    });
    if (error) setMessage(error.message);
    else {
      setForm({ name: "", address: "", latitude: "", longitude: "", radius: "200" });
      setMessage("Workplace added.");
      await load();
    }
  }

  async function updateWorkplace(id: string, changes: Partial<Workplace>) {
    const { error } = await supabase.from("workplaces").update(changes).eq("id", id);
    if (error) setMessage(error.message);
    else {
      setMessage("Workplace updated.");
      await load();
    }
  }

  return (
    <>
      <PageTitle title="Workplaces" subtitle="Manage active sites and GPS radius settings." />
      <Card className="mb-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_130px_130px_130px_auto]">
          <Input placeholder="Name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          <Input placeholder="Address" value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} />
          <Input placeholder="Latitude" value={form.latitude} onChange={(event) => setForm({ ...form, latitude: event.target.value })} />
          <Input placeholder="Longitude" value={form.longitude} onChange={(event) => setForm({ ...form, longitude: event.target.value })} />
          <Input placeholder="Radius m" value={form.radius} onChange={(event) => setForm({ ...form, radius: event.target.value })} />
          <Button className="bg-ink text-white" onClick={addWorkplace}><Plus size={18} />Add</Button>
        </div>
        {message ? <p className="mt-3 rounded-md bg-safety/25 p-3 text-sm font-semibold">{message}</p> : null}
      </Card>
      <div className="space-y-3">
        {rows.map((row) => <WorkplaceRow key={row.id} row={row} onUpdate={updateWorkplace} />)}
      </div>
    </>
  );
}

function WorkplaceRow({ row, onUpdate }: { row: Workplace; onUpdate: (id: string, changes: Partial<Workplace>) => void }) {
  const [name, setName] = useState(row.name);
  const [address, setAddress] = useState(row.address ?? "");
  const [latitude, setLatitude] = useState(String(row.latitude ?? ""));
  const [longitude, setLongitude] = useState(String(row.longitude ?? ""));
  const [radius, setRadius] = useState(String(row.allowed_radius_meters ?? ""));

  return (
    <Card>
      <div className="mb-3 flex justify-between gap-3">
        <p className="font-bold">{row.name}</p>
        <StatusPill tone={row.active ? "good" : "neutral"}>{row.active ? "Active" : "Inactive"}</StatusPill>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_130px_130px_130px_auto_auto]">
        <Input value={name} onChange={(event) => setName(event.target.value)} />
        <Input value={address} onChange={(event) => setAddress(event.target.value)} />
        <Input value={latitude} onChange={(event) => setLatitude(event.target.value)} />
        <Input value={longitude} onChange={(event) => setLongitude(event.target.value)} />
        <Input value={radius} onChange={(event) => setRadius(event.target.value)} />
        <Button className="bg-field text-white" onClick={() => onUpdate(row.id, {
          name,
          address: address || null,
          latitude: latitude ? Number(latitude) : null,
          longitude: longitude ? Number(longitude) : null,
          allowed_radius_meters: radius ? Number(radius) : null
        })}><Save size={18} />Save</Button>
        <Button className="bg-black/10 text-ink" onClick={() => onUpdate(row.id, { active: !row.active })}>{row.active ? "Deactivate" : "Activate"}</Button>
      </div>
    </Card>
  );
}
