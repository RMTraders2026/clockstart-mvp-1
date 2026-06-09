"use client";

import { useEffect, useState } from "react";
import { RequireAuth } from "@/components/RequireAuth";
import { Card, PageTitle, StatusPill } from "@/components/ui";
import { formatDate, formatDateTime } from "@/lib/dates";
import { supabase } from "@/lib/supabase";
import type { Profile, Timesheet } from "@/lib/types";

function MyTimesheetsInner({ profile }: { profile: Profile }) {
  const [rows, setRows] = useState<Timesheet[]>([]);

  useEffect(() => {
    supabase
      .from("timesheets")
      .select("*, workplaces(name,address)")
      .eq("employee_id", profile.id)
      .order("date", { ascending: false })
      .then(({ data }) => setRows((data ?? []) as Timesheet[]));
  }, [profile.id]);

  return (
    <>
      <PageTitle title="My Timesheets" subtitle="Your submitted and approved work history." />
      <div className="space-y-3">
        {rows.map((row) => (
          <Card key={row.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-bold">{row.workplaces?.name ?? "Workplace"}</h2>
                <p className="text-sm text-steel">{formatDate(row.date)}</p>
              </div>
              <StatusPill tone={row.status === "approved" ? "good" : row.status === "rejected" ? "bad" : "neutral"}>{row.status}</StatusPill>
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-steel">Clock in</dt>
                <dd className="font-semibold">{formatDateTime(row.clock_in_time)}</dd>
              </div>
              <div>
                <dt className="text-steel">Clock out</dt>
                <dd className="font-semibold">{formatDateTime(row.clock_out_time)}</dd>
              </div>
              <div>
                <dt className="text-steel">Break</dt>
                <dd className="font-semibold">{row.break_minutes ?? "-"} min</dd>
              </div>
              <div>
                <dt className="text-steel">Hours</dt>
                <dd className="font-semibold">{row.total_hours ?? "-"}</dd>
              </div>
            </dl>
            {row.work_notes ? <p className="mt-3 rounded-md bg-black/5 p-3 text-sm">{row.work_notes}</p> : null}
          </Card>
        ))}
        {!rows.length ? <Card>No timesheets yet.</Card> : null}
      </div>
    </>
  );
}

export default function MyTimesheetsPage() {
  return <RequireAuth role="employee">{(profile) => <MyTimesheetsInner profile={profile} />}</RequireAuth>;
}
