"use client";

import { useEffect, useState } from "react";
import { MapPin, Plus, Save, Search, Trash2 } from "lucide-react";
import { RequireAuth } from "@/components/RequireAuth";
import { Button, Card, Input, PageTitle, StatusPill } from "@/components/ui";
import { lookupAddress } from "@/lib/geocode";
import { absoluteAppUrl, qrImageUrl } from "@/lib/qr";
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
  const [form, setForm] = useState({
    name: "Roma Yard",
    address: "222 Raglan Street, Roma QLD 4455",
    latitude: "",
    longitude: "",
    radius: "200"
  });
  const [message, setMessage] = useState("");
  const [lookingUp, setLookingUp] = useState(false);

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

  async function lookupNewWorkplaceAddress() {
    try {
      setLookingUp(true);
      setMessage("");
      const result = await lookupAddress(form.address);
      setForm({
        ...form,
        latitude: result.latitude.toFixed(6),
        longitude: result.longitude.toFixed(6)
      });
      setMessage(`Coordinates found for ${result.displayName}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Address lookup failed.");
    } finally {
      setLookingUp(false);
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

  async function deleteWorkplace(row: Workplace) {
    const confirmed = window.confirm(`Completely delete ${row.name}? This cannot be undone.`);
    if (!confirmed) return;

    const { error } = await supabase.from("workplaces").delete().eq("id", row.id);
    if (error) {
      setMessage(`Could not delete ${row.name}. If it has timesheets, pre-starts, or machines linked to it, deactivate it instead.`);
    } else {
      setMessage(`${row.name} deleted.`);
      await load();
    }
  }

  return (
    <>
      <PageTitle title="Workplaces" subtitle="Manage active sites and GPS radius settings." />
      <Card className="mb-4">
        <div className="mb-3 flex items-start gap-2 rounded-md bg-field/10 p-3 text-sm text-field">
          <MapPin className="mt-0.5 shrink-0" size={18} />
          <p className="font-semibold">Enter the workplace address, then use lookup to fill latitude and longitude automatically.</p>
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          <label className="text-sm font-semibold">
            Workplace name
            <Input placeholder="Roma Yard" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          </label>
          <label className="text-sm font-semibold">
            Address
            <Input placeholder="222 Raglan Street, Roma QLD 4455" value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} />
          </label>
          <div className="grid gap-3 sm:grid-cols-3 lg:col-span-2">
            <label className="text-sm font-semibold">
              Latitude
              <Input placeholder="-26.5733" value={form.latitude} onChange={(event) => setForm({ ...form, latitude: event.target.value })} />
            </label>
            <label className="text-sm font-semibold">
              Longitude
              <Input placeholder="148.7869" value={form.longitude} onChange={(event) => setForm({ ...form, longitude: event.target.value })} />
            </label>
            <label className="text-sm font-semibold">
              Radius metres
              <Input placeholder="200" value={form.radius} onChange={(event) => setForm({ ...form, radius: event.target.value })} />
            </label>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:col-span-2">
            <Button className="bg-safety text-ink" disabled={lookingUp} onClick={lookupNewWorkplaceAddress}>
              <Search size={18} />
              Lookup coordinates
            </Button>
            <Button className="bg-ink text-white" onClick={addWorkplace}><Plus size={18} />Add workplace</Button>
          </div>
        </div>
        {message ? <p className="mt-3 rounded-md bg-safety/25 p-3 text-sm font-semibold">{message}</p> : null}
      </Card>
      <div className="space-y-3">
        {rows.map((row) => (
          <WorkplaceRow
            key={row.id}
            row={row}
            onDelete={deleteWorkplace}
            onUpdate={updateWorkplace}
            onMessage={setMessage}
          />
        ))}
      </div>
    </>
  );
}

function WorkplaceRow({
  row,
  onDelete,
  onUpdate,
  onMessage
}: {
  row: Workplace;
  onDelete: (row: Workplace) => void;
  onUpdate: (id: string, changes: Partial<Workplace>) => void;
  onMessage: (message: string) => void;
}) {
  const [name, setName] = useState(row.name);
  const [address, setAddress] = useState(row.address ?? "");
  const [latitude, setLatitude] = useState(String(row.latitude ?? ""));
  const [longitude, setLongitude] = useState(String(row.longitude ?? ""));
  const [radius, setRadius] = useState(String(row.allowed_radius_meters ?? ""));
  const [lookingUp, setLookingUp] = useState(false);
  const clockInUrl = absoluteAppUrl(`/today?workplaceId=${row.id}`);

  async function lookupExistingAddress() {
    try {
      setLookingUp(true);
      onMessage("");
      const result = await lookupAddress(address);
      setLatitude(result.latitude.toFixed(6));
      setLongitude(result.longitude.toFixed(6));
      onMessage(`Coordinates found for ${result.displayName}. Save this workplace to keep them.`);
    } catch (error) {
      onMessage(error instanceof Error ? error.message : "Address lookup failed.");
    } finally {
      setLookingUp(false);
    }
  }

  return (
    <Card>
      <div className="mb-3 flex justify-between gap-3">
        <p className="font-bold">{row.name}</p>
        <StatusPill tone={row.active ? "good" : "neutral"}>{row.active ? "Active" : "Inactive"}</StatusPill>
      </div>
      <div className="grid gap-5 xl:grid-cols-[1fr_220px]">
        <div className="space-y-3">
          <div className="grid gap-3 lg:grid-cols-2">
            <label className="text-sm font-semibold">
              Workplace name
              <Input value={name} onChange={(event) => setName(event.target.value)} />
            </label>
            <label className="text-sm font-semibold">
              Address
              <Input value={address} onChange={(event) => setAddress(event.target.value)} />
            </label>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="text-sm font-semibold">
              Latitude
              <Input value={latitude} onChange={(event) => setLatitude(event.target.value)} />
            </label>
            <label className="text-sm font-semibold">
              Longitude
              <Input value={longitude} onChange={(event) => setLongitude(event.target.value)} />
            </label>
            <label className="text-sm font-semibold">
              Radius metres
              <Input value={radius} onChange={(event) => setRadius(event.target.value)} />
            </label>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Button className="bg-safety text-ink" disabled={lookingUp} onClick={lookupExistingAddress}>
              <Search size={18} />
              Lookup coordinates
            </Button>
            <Button className="bg-field text-white" onClick={() => onUpdate(row.id, {
              name,
              address: address || null,
              latitude: latitude ? Number(latitude) : null,
              longitude: longitude ? Number(longitude) : null,
              allowed_radius_meters: radius ? Number(radius) : null
            })}><Save size={18} />Save</Button>
            <Button className="bg-black/10 text-ink" onClick={() => onUpdate(row.id, { active: !row.active })}>{row.active ? "Deactivate" : "Activate"}</Button>
            <Button className="bg-red-700 text-white" onClick={() => onDelete(row)}>
              <Trash2 size={18} />
              Delete
            </Button>
          </div>
        </div>
        <div>
          <p className="mb-2 text-sm font-bold">Clock-in QR</p>
          <img src={qrImageUrl(clockInUrl)} alt={`${row.name} clock-in QR code`} className="h-32 w-32 rounded-md border border-black/10" />
          <p className="mt-2 break-all text-xs text-steel">{clockInUrl}</p>
        </div>
      </div>
    </Card>
  );
}
