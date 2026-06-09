"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, Clock, FileDown } from "lucide-react";
import { RequireAuth } from "@/components/RequireAuth";
import { Card, PageTitle, StatusPill } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import { formatDateTime } from "@/lib/dates";
import type { Timesheet } from "@/lib/types";

export default function AdminDashboardPage() {
  return (
    <RequireAuth role="admin">
      {() => <AdminDashboard />}
    </RequireAuth>
  );
}

function AdminDashboard() {
  const [active, setActive] = useState<Timesheet[]>([]);
  const [submittedCount, setSubmittedCount] = useState(0);
  const [outsideCount, setOutsideCount] = useState(0);

  useEffect(() => {
    supabase
      .from("timesheets")
      .select("*, profiles(full_name,email), workplaces(name,address)")
      .eq("status", "active")
      .order("clock_in_time", { ascending: false })
      .then(({ data }) => setActive((data ?? []) as Timesheet[]));

    supabase
      .from("timesheets")
      .select("id", { count: "exact", head: true })
      .eq("status", "submitted")
      .then(({ count }) => setSubmittedCount(count ?? 0));

    supabase
      .from("timesheets")
      .select("id", { count: "exact", head: true })
      .or("clock_in_outside_radius.eq.true,clock_out_outside_radius.eq.true")
      .then(({ count }) => setOutsideCount(count ?? 0));
  }, []);

  return (
    <>
      <PageTitle title="Admin Dashboard" subtitle="Live clock-ins, pending approvals, and GPS review flags." />
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <Clock className="mb-3 text-field" />
          <p className="text-3xl font-bold">{active.length}</p>
          <p className="text-sm text-steel">Currently clocked in</p>
        </Card>
        <Card>
          <CheckCircle2 className="mb-3 text-clay" />
          <p className="text-3xl font-bold">{submittedCount}</p>
          <p className="text-sm text-steel">Awaiting review</p>
        </Card>
        <Card>
          <AlertTriangle className="mb-3 text-safety" />
          <p className="text-3xl font-bold">{outsideCount}</p>
          <p className="text-sm text-steel">GPS flags</p>
        </Card>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_0.5fr]">
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold">Current Clock-ins</h2>
            <Link className="text-sm font-bold text-field" href="/admin/current-clock-ins">View all</Link>
          </div>
          <div className="space-y-3">
            {active.slice(0, 5).map((row) => (
              <div key={row.id} className="rounded-md border border-black/10 p-3">
                <div className="flex justify-between gap-3">
                  <div>
                    <p className="font-bold">{row.profiles?.full_name}</p>
                    <p className="text-sm text-steel">{row.workplaces?.name}</p>
                  </div>
                  <StatusPill tone={row.clock_in_outside_radius ? "warn" : "good"}>{row.clock_in_outside_radius ? "GPS flag" : "Inside"}</StatusPill>
                </div>
                <p className="mt-2 text-sm">Clocked in {formatDateTime(row.clock_in_time)}</p>
              </div>
            ))}
            {!active.length ? <p className="text-sm text-steel">No one is clocked in.</p> : null}
          </div>
        </Card>
        <Card>
          <h2 className="mb-3 text-lg font-bold">Exports</h2>
          <Link href="/admin/export" className="focus-ring inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-ink px-4 font-bold text-white">
            <FileDown size={18} />
            Weekly CSV
          </Link>
        </Card>
      </div>
    </>
  );
}
