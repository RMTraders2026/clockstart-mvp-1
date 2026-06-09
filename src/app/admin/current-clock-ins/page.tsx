"use client";

import { useEffect, useState } from "react";
import { RequireAuth } from "@/components/RequireAuth";
import { Card, PageTitle, StatusPill } from "@/components/ui";
import { formatDateTime } from "@/lib/dates";
import { supabase } from "@/lib/supabase";
import type { Timesheet } from "@/lib/types";

export default function CurrentClockInsPage() {
  return (
    <RequireAuth role="admin">
      {() => <CurrentClockIns />}
    </RequireAuth>
  );
}

function CurrentClockIns() {
  const [rows, setRows] = useState<Timesheet[]>([]);

  useEffect(() => {
    supabase
      .from("timesheets")
      .select("*, profiles(full_name,email), workplaces(name,address)")
      .eq("status", "active")
      .order("clock_in_time", { ascending: false })
      .then(({ data }) => setRows((data ?? []) as Timesheet[]));
  }, []);

  return (
    <>
      <PageTitle title="Current Clock-ins" subtitle="Employees with an active timesheet." />
      <div className="space-y-3">
        {rows.map((row) => (
          <Card key={row.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-bold">{row.profiles?.full_name}</h2>
                <p className="text-sm text-steel">{row.workplaces?.name}</p>
              </div>
              <StatusPill tone={row.clock_in_outside_radius ? "warn" : "good"}>{row.clock_in_outside_radius ? "Outside radius" : "Inside radius"}</StatusPill>
            </div>
            <p className="mt-3 text-sm">Clocked in {formatDateTime(row.clock_in_time)}</p>
          </Card>
        ))}
        {!rows.length ? <Card>No active clock-ins.</Card> : null}
      </div>
    </>
  );
}
