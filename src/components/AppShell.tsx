"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CalendarDays, ClipboardCheck, LogOut, ShieldCheck, Timer, Users, Warehouse } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Profile } from "@/lib/types";

const employeeLinks = [
  { href: "/today", label: "Today", icon: Timer },
  { href: "/my-timesheets", label: "My sheets", icon: CalendarDays }
];

const adminLinks = [
  { href: "/admin", label: "Dashboard", icon: ShieldCheck },
  { href: "/admin/current-clock-ins", label: "Clocked in", icon: Timer },
  { href: "/admin/timesheets", label: "Timesheets", icon: CalendarDays },
  { href: "/admin/prestarts", label: "Pre-starts", icon: ClipboardCheck },
  { href: "/admin/employees", label: "Employees", icon: Users },
  { href: "/admin/workplaces", label: "Sites", icon: Warehouse }
];

export function AppShell({ profile, children }: { profile: Profile; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const links = profile.role === "admin" ? adminLinks : employeeLinks;

  async function signOut() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  return (
    <div className="min-h-screen bg-[#f6f5ef]">
      <header className="sticky top-0 z-10 border-b border-black/10 bg-white/95">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <Link href={profile.role === "admin" ? "/admin" : "/today"} className="font-bold text-ink">
            ClockStart
          </Link>
          <div className="min-w-0 text-right text-xs text-steel">
            <div className="truncate font-medium text-ink">{profile.full_name}</div>
            <div className="capitalize">{profile.role}</div>
          </div>
          <button
            aria-label="Sign out"
            onClick={signOut}
            className="focus-ring rounded-md border border-black/10 bg-white p-2 text-ink"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-5 pb-24">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-black/10 bg-white">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-1 px-2 py-2 sm:flex sm:flex-wrap">
          {links.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`focus-ring flex min-h-12 items-center justify-center gap-2 rounded-md px-2 text-sm font-semibold ${
                  active ? "bg-field text-white" : "text-ink"
                }`}
              >
                <Icon size={17} />
                <span>{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
