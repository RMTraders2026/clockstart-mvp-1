import type { ButtonHTMLAttributes, InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

export function PageTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-5">
      <h1 className="text-2xl font-bold text-ink sm:text-3xl">{title}</h1>
      {subtitle ? <p className="mt-1 text-sm text-steel">{subtitle}</p> : null}
    </div>
  );
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-md border border-black/10 bg-white p-4 shadow-soft ${className}`}>{children}</section>;
}

export function Button({ className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-md px-4 font-bold disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    />
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className="focus-ring min-h-12 w-full rounded-md border border-black/15 bg-white px-3" />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className="focus-ring min-h-12 w-full rounded-md border border-black/15 bg-white px-3" />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className="focus-ring min-h-28 w-full rounded-md border border-black/15 bg-white px-3 py-3" />;
}

export function StatusPill({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "good" | "warn" | "bad" | "neutral" }) {
  const tones = {
    good: "bg-field/10 text-field",
    warn: "bg-safety/25 text-ink",
    bad: "bg-red-100 text-red-800",
    neutral: "bg-black/5 text-steel"
  };
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${tones[tone]}`}>{children}</span>;
}
