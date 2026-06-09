"use client";

import { useState } from "react";
import { FileDown } from "lucide-react";
import { RequireAuth } from "@/components/RequireAuth";
import { Button, Card, Input, PageTitle } from "@/components/ui";
import { timesheetsToCsv } from "@/lib/csv";
import { supabase } from "@/lib/supabase";
import type { Timesheet } from "@/lib/types";

export default function ExportPage() {
  return (
    <RequireAuth role="admin">
      {() => <Export />}
    </RequireAuth>
  );
}

function Export() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [message, setMessage] = useState("");

  async function exportCsv() {
    if (!startDate || !endDate) {
      setMessage("Choose a start and end date.");
      return;
    }
    const { data, error } = await supabase
      .from("timesheets")
      .select("*, profiles(full_name,email), workplaces(name,address)")
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date", { ascending: true });

    if (error) {
      setMessage(error.message);
      return;
    }

    const csv = timesheetsToCsv((data ?? []) as Timesheet[]);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `weekly-timesheets-${startDate}-to-${endDate}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    setMessage(`Exported ${(data ?? []).length} timesheets.`);
  }

  return (
    <>
      <PageTitle title="CSV Export" subtitle="Export weekly timesheets for payroll or admin review." />
      <Card>
        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <label className="text-sm font-semibold">Start date<Input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} /></label>
          <label className="text-sm font-semibold">End date<Input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} /></label>
          <Button className="self-end bg-ink text-white" onClick={exportCsv}><FileDown size={18} />Export CSV</Button>
        </div>
        {message ? <p className="mt-3 rounded-md bg-safety/25 p-3 text-sm font-semibold">{message}</p> : null}
      </Card>
    </>
  );
}
