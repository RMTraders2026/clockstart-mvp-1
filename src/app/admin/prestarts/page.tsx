"use client";

import { useEffect, useState } from "react";
import { RequireAuth } from "@/components/RequireAuth";
import { Card, Input, PageTitle } from "@/components/ui";
import { formatDateTime } from "@/lib/dates";
import { supabase } from "@/lib/supabase";
import type { Prestart } from "@/lib/types";

type PrestartRow = Prestart & {
  profiles?: { full_name: string; email: string } | null;
  workplaces?: { name: string } | null;
};

export default function AdminPrestartsPage() {
  return (
    <RequireAuth role="admin">
      {() => <AdminPrestarts />}
    </RequireAuth>
  );
}

function AdminPrestarts() {
  const [rows, setRows] = useState<PrestartRow[]>([]);
  const [date, setDate] = useState("");

  useEffect(() => {
    let query = supabase
      .from("prestarts")
      .select("*, profiles(full_name,email), workplaces(name)")
      .order("submitted_at", { ascending: false });
    if (date) query = query.eq("date", date);
    query.then(({ data }) => setRows((data ?? []) as PrestartRow[]));
  }, [date]);

  return (
    <>
      <PageTitle title="Pre-starts" subtitle="Daily declarations submitted by employees." />
      <Card className="mb-4">
        <Input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
      </Card>
      <div className="space-y-3">
        {rows.map((row) => (
          <Card key={row.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-bold">{row.profiles?.full_name}</h2>
                <p className="text-sm text-steel">{row.workplaces?.name} - {row.date}</p>
              </div>
              <p className="text-right text-xs font-semibold text-steel">{formatDateTime(row.submitted_at)}</p>
            </div>
            <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
              <p>Fit for work: {row.fit_for_work ? "Yes" : "No"}</p>
              <p>Not under influence: {row.not_under_influence ? "Yes" : "No"}</p>
              <p>PPE: {row.ppe_available ? "Yes" : "No"}</p>
              <p>Hazards understood: {row.hazards_understood ? "Yes" : "No"}</p>
              <p>Site rules: {row.site_rules_acknowledged ? "Yes" : "No"}</p>
              <p>Authorised equipment: {row.authorised_equipment_acknowledged ? "Yes" : "No"}</p>
            </div>
            <p className="mt-3 text-sm font-semibold">Signed: {row.signature_name}</p>
            {row.comments ? <p className="mt-2 rounded-md bg-black/5 p-3 text-sm">{row.comments}</p> : null}
          </Card>
        ))}
        {!rows.length ? <Card>No pre-starts found.</Card> : null}
      </div>
    </>
  );
}
