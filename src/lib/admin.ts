"use client";

import { supabase } from "@/lib/supabase";

export async function logAudit(userId: string, action: string, tableName: string, recordId: string, oldValue: unknown, newValue: unknown) {
  await supabase.from("audit_logs").insert({
    user_id: userId,
    action,
    table_name: tableName,
    record_id: recordId,
    old_value: oldValue,
    new_value: newValue
  });
}
