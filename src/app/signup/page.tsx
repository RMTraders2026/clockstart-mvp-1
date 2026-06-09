"use client";

import Link from "next/link";
import { useState } from "react";
import { BrandLogo } from "@/components/BrandLogo";
import { Button, Card, Input } from "@/components/ui";
import { supabase } from "@/lib/supabase";

export default function SignupPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [jobRole, setJobRole] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function signUp(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone,
          job_role: jobRole,
          role: "employee"
        }
      }
    });

    setBusy(false);
    if (error) setMessage(error.message);
    else setMessage("Employee account created. You can now sign in.");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f6f5ef] px-4 py-8">
      <Card className="w-full max-w-md">
        <div className="mb-6">
          <BrandLogo />
          <h1 className="mt-3 text-3xl font-bold text-ink">Add new employee</h1>
          <p className="mt-2 text-sm text-steel">Create an employee login for Rural Metal Traders.</p>
        </div>
        <form onSubmit={signUp} className="space-y-4">
          <label className="block text-sm font-semibold">
            Full name
            <Input value={fullName} onChange={(event) => setFullName(event.target.value)} required />
          </label>
          <label className="block text-sm font-semibold">
            Email
            <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </label>
          <label className="block text-sm font-semibold">
            Phone number
            <Input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} />
          </label>
          <label className="block text-sm font-semibold">
            Role / position
            <Input placeholder="Operator, driver, yard hand" value={jobRole} onChange={(event) => setJobRole(event.target.value)} />
          </label>
          <label className="block text-sm font-semibold">
            Password
            <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={6} />
          </label>
          {message ? <p className="rounded-md bg-safety/25 p-3 text-sm font-semibold">{message}</p> : null}
          <Button className="w-full bg-field text-white" disabled={busy}>{busy ? "Creating..." : "Create employee login"}</Button>
        </form>
        <Link
          href="/login"
          className="focus-ring mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-md border border-black/10 bg-white px-4 text-sm font-bold text-ink"
        >
          Back to sign in
        </Link>
      </Card>
    </main>
  );
}
