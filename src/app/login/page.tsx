"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn } from "lucide-react";
import { Button, Card, Input } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import { getSessionProfile } from "@/lib/data";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    const { profile } = await getSessionProfile();
    router.replace(profile?.role === "admin" ? "/admin" : "/today");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f6f5ef] px-4 py-8">
      <Card className="w-full max-w-md">
        <div className="mb-6">
          <p className="text-sm font-bold uppercase tracking-wide text-clay">ClockStart</p>
          <h1 className="mt-1 text-3xl font-bold text-ink">Sign in</h1>
          <p className="mt-2 text-sm text-steel">Use your workplace email and password.</p>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block text-sm font-semibold">
            Email
            <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" />
          </label>
          <label className="block text-sm font-semibold">
            Password
            <Input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              autoComplete="current-password"
            />
          </label>
          {error ? <p className="rounded-md bg-red-50 p-3 text-sm font-semibold text-red-800">{error}</p> : null}
          <Button className="w-full bg-field text-white" disabled={loading}>
            <LogIn size={18} />
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </Card>
    </main>
  );
}
