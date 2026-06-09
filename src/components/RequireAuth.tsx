"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { getSessionProfile } from "@/lib/data";
import type { Profile, Role } from "@/lib/types";

export function RequireAuth({
  role,
  children
}: {
  role?: Role;
  children: (profile: Profile) => React.ReactNode;
}) {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSessionProfile().then(({ user, profile }) => {
      if (!user || !profile || !profile.active) {
        const nextPath = `${window.location.pathname}${window.location.search}`;
        router.replace(`/login?next=${encodeURIComponent(nextPath)}`);
        return;
      }
      if (role && profile.role !== role) {
        router.replace(profile.role === "admin" ? "/admin" : "/today");
        return;
      }
      setProfile(profile);
      setLoading(false);
    });
  }, [role, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f6f5ef] px-4 text-sm font-semibold text-steel">
        Loading ClockStart...
      </div>
    );
  }

  return profile ? <AppShell profile={profile}>{children(profile)}</AppShell> : null;
}
