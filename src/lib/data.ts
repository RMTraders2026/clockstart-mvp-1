"use client";

import { supabase } from "@/lib/supabase";
import type { Profile, Workplace } from "@/lib/types";

export async function getSessionProfile() {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) return { user: null, profile: null };

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", authData.user.id)
    .single<Profile>();

  return { user: authData.user, profile };
}

export async function getActiveWorkplaces() {
  const { data, error } = await supabase
    .from("workplaces")
    .select("*")
    .eq("active", true)
    .order("name");

  if (error) throw error;
  return (data ?? []) as Workplace[];
}
