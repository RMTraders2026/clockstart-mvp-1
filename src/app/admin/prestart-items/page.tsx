"use client";

import { useEffect, useState } from "react";
import { Plus, RotateCcw, Save, Trash2 } from "lucide-react";
import { RequireAuth } from "@/components/RequireAuth";
import { Button, Card, Input, PageTitle, StatusPill } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import type { PrestartItem } from "@/lib/types";

export default function AdminPrestartItemsPage() {
  return <RequireAuth role="admin">{() => <AdminPrestartItems />}</RequireAuth>;
}

function AdminPrestartItems() {
  const [items, setItems] = useState<PrestartItem[]>([]);
  const [newLabel, setNewLabel] = useState("");
  const [newSortOrder, setNewSortOrder] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function loadItems() {
    const { data } = await supabase
      .from("prestart_items")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    setItems((data ?? []) as PrestartItem[]);
  }

  useEffect(() => {
    loadItems();
  }, []);

  async function addItem() {
    if (newLabel.trim().length < 3) {
      setMessage("Add a checklist item first.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("prestart_items").insert({
      label: newLabel.trim(),
      sort_order: newSortOrder === "" ? items.length + 1 : Number(newSortOrder),
      active: true
    });
    setBusy(false);
    if (error) setMessage(error.message);
    else {
      setMessage("Checklist item added.");
      setNewLabel("");
      setNewSortOrder("");
      await loadItems();
    }
  }

  async function saveItem(item: PrestartItem) {
    if (item.label.trim().length < 3) {
      setMessage("Checklist item must have a label.");
      return;
    }
    setBusy(true);
    const { error } = await supabase
      .from("prestart_items")
      .update({
        label: item.label.trim(),
        sort_order: Number(item.sort_order) || 0,
        active: item.active
      })
      .eq("id", item.id);
    setBusy(false);
    if (error) setMessage(error.message);
    else {
      setMessage("Checklist item saved.");
      await loadItems();
    }
  }

  async function setItemActive(item: PrestartItem, active: boolean) {
    setBusy(true);
    const { error } = await supabase.from("prestart_items").update({ active }).eq("id", item.id);
    setBusy(false);
    if (error) setMessage(error.message);
    else {
      setMessage(active ? "Checklist item restored." : "Checklist item removed from employee pre-starts.");
      await loadItems();
    }
  }

  return (
    <>
      <PageTitle title="Daily Checklist" subtitle="Add, remove, or reorder the questions employees tick before clocking in." />

      <Card className="mb-4">
        <h2 className="mb-3 text-lg font-bold">Add Item</h2>
        <div className="grid gap-3 sm:grid-cols-[1fr_140px_auto]">
          <label className="text-sm font-semibold">
            Checklist wording
            <Input value={newLabel} onChange={(event) => setNewLabel(event.target.value)} />
          </label>
          <label className="text-sm font-semibold">
            Order
            <Input type="number" min="0" value={newSortOrder} onChange={(event) => setNewSortOrder(event.target.value)} />
          </label>
          <Button disabled={busy} onClick={addItem} className="self-end bg-field text-white">
            <Plus size={18} />
            Add
          </Button>
        </div>
        {message ? <p className="mt-3 rounded-md bg-safety/25 p-3 text-sm font-semibold">{message}</p> : null}
      </Card>

      <div className="space-y-3">
        {items.map((item, index) => (
          <Card key={item.id}>
            <div className="grid gap-3 lg:grid-cols-[90px_1fr_auto]">
              <label className="text-sm font-semibold">
                Order
                <Input
                  type="number"
                  min="0"
                  value={item.sort_order}
                  onChange={(event) =>
                    setItems((current) =>
                      current.map((row, rowIndex) => (rowIndex === index ? { ...row, sort_order: Number(event.target.value) } : row))
                    )
                  }
                />
              </label>
              <label className="text-sm font-semibold">
                Checklist wording
                <Input
                  value={item.label}
                  onChange={(event) =>
                    setItems((current) =>
                      current.map((row, rowIndex) => (rowIndex === index ? { ...row, label: event.target.value } : row))
                    )
                  }
                />
              </label>
              <div className="flex flex-wrap items-end gap-2">
                <StatusPill tone={item.active ? "good" : "neutral"}>{item.active ? "Active" : "Removed"}</StatusPill>
                <Button disabled={busy} onClick={() => saveItem(item)} className="bg-ink text-white">
                  <Save size={18} />
                  Save
                </Button>
                {item.active ? (
                  <Button disabled={busy} onClick={() => setItemActive(item, false)} className="bg-red-700 text-white">
                    <Trash2 size={18} />
                    Remove
                  </Button>
                ) : (
                  <Button disabled={busy} onClick={() => setItemActive(item, true)} className="bg-field text-white">
                    <RotateCcw size={18} />
                    Restore
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
        {!items.length ? <Card>No checklist items yet.</Card> : null}
      </div>
    </>
  );
}
