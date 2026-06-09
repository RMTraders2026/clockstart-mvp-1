import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import type { Role } from "@/lib/types";

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Missing Supabase URL or service role key.");
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Missing admin session." }, { status: 401 });
    }

    const adminClient = getAdminClient();
    const {
      data: { user }
    } = await adminClient.auth.getUser(token);

    if (!user) {
      return NextResponse.json({ error: "Invalid admin session." }, { status: 401 });
    }

    const { data: adminProfile } = await adminClient
      .from("profiles")
      .select("role, active")
      .eq("id", user.id)
      .single();

    if (!adminProfile?.active || adminProfile.role !== "admin") {
      return NextResponse.json({ error: "Only admins can create employees." }, { status: 403 });
    }

    const body = (await request.json()) as {
      full_name?: string;
      email?: string;
      phone?: string;
      job_role?: string;
      password?: string;
      role?: Role;
    };

    if (!body.full_name || !body.email || !body.password) {
      return NextResponse.json({ error: "Name, email, and temporary password are required." }, { status: 400 });
    }

    const { data, error } = await adminClient.auth.admin.createUser({
      email: body.email,
      password: body.password,
      email_confirm: true,
      user_metadata: {
        full_name: body.full_name,
        phone: body.phone ?? "",
        job_role: body.job_role ?? "",
        role: body.role ?? "employee"
      }
    });

    if (error || !data.user) {
      return NextResponse.json({ error: error?.message ?? "Could not create user." }, { status: 400 });
    }

    await adminClient.from("profiles").upsert({
      id: data.user.id,
      full_name: body.full_name,
      email: body.email,
      phone: body.phone ?? null,
      job_role: body.job_role ?? null,
      role: body.role ?? "employee",
      active: true
    });

    return NextResponse.json({ id: data.user.id });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not create employee." },
      { status: 500 }
    );
  }
}
