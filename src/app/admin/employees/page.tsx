"use client";

import { useEffect, useState } from "react";
import { Plus, Save } from "lucide-react";
import { RequireAuth } from "@/components/RequireAuth";
import { Button, Card, Input, PageTitle, Select, StatusPill } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import type { Profile, Role } from "@/lib/types";

export default function EmployeesPage() {
  return (
    <RequireAuth role="admin">
      {() => <Employees />}
    </RequireAuth>
  );
}

function Employees() {
  const [rows, setRows] = useState<Profile[]>([]);
  const [form, setForm] = useState({ id: "", full_name: "", email: "", role: "employee" as Role });
  const [message, setMessage] = useState("");

  async function load() {
    const { data } = await supabase.from("profiles").select("*").order("full_name");
    setRows((data ?? []) as Profile[]);
  }

  useEffect(() => {
    load();
  }, []);

  async function addEmployee() {
    if (!form.id || !form.full_name || !form.email) {
      setMessage("Create the Auth user first, then enter their UUID, name, and email here.");
      return;
    }
    const { error } = await supabase.from("profiles").insert({
      id: form.id,
      full_name: form.full_name,
      email: form.email,
      role: form.role,
      active: true
    });
    if (error) setMessage(error.message);
    else {
      setForm({ id: "", full_name: "", email: "", role: "employee" });
      setMessage("Employee profile added.");
      await load();
    }
  }

  async function updateProfile(row: Profile, changes: Partial<Profile>) {
    const { error } = await supabase.from("profiles").update(changes).eq("id", row.id);
    if (error) setMessage(error.message);
    else {
      setMessage("Employee updated.");
      await load();
    }
  }

  return (
    <>
      <PageTitle title="Employees" subtitle="Add, edit, and deactivate employee profile records." />
      <Card className="mb-4">
        <p className="mb-3 text-sm text-steel">Create the Auth user in Supabase first, then paste their user UUID here.</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_160px_auto]">
          <Input placeholder="Auth user UUID" value={form.id} onChange={(event) => setForm({ ...form, id: event.target.value })} />
          <Input placeholder="Full name" value={form.full_name} onChange={(event) => setForm({ ...form, full_name: event.target.value })} />
          <Input placeholder="Email" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
          <Select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value as Role })}>
            <option value="employee">Employee</option>
            <option value="admin">Admin</option>
          </Select>
          <Button className="bg-ink text-white" onClick={addEmployee}><Plus size={18} />Add</Button>
        </div>
        {message ? <p className="mt-3 rounded-md bg-safety/25 p-3 text-sm font-semibold">{message}</p> : null}
      </Card>
      <div className="space-y-3">
        {rows.map((row) => <EmployeeRow key={row.id} row={row} onUpdate={updateProfile} />)}
      </div>
    </>
  );
}

function EmployeeRow({ row, onUpdate }: { row: Profile; onUpdate: (row: Profile, changes: Partial<Profile>) => void }) {
  const [fullName, setFullName] = useState(row.full_name);
  const [role, setRole] = useState<Role>(row.role);

  return (
    <Card>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="font-bold">{row.email}</p>
          <p className="text-xs text-steel">{row.id}</p>
        </div>
        <StatusPill tone={row.active ? "good" : "neutral"}>{row.active ? "Active" : "Inactive"}</StatusPill>
      </div>
      <div className="grid gap-3 sm:grid-cols-[1fr_180px_auto_auto]">
        <Input value={fullName} onChange={(event) => setFullName(event.target.value)} />
        <Select value={role} onChange={(event) => setRole(event.target.value as Role)}>
          <option value="employee">Employee</option>
          <option value="admin">Admin</option>
        </Select>
        <Button className="bg-field text-white" onClick={() => onUpdate(row, { full_name: fullName, role })}><Save size={18} />Save</Button>
        <Button className="bg-black/10 text-ink" onClick={() => onUpdate(row, { active: !row.active })}>{row.active ? "Deactivate" : "Activate"}</Button>
      </div>
    </Card>
  );
}
