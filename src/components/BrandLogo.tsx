import Image from "next/image";

export function BrandLogo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <Image
        src="/rural-metal-traders-logo.jpg"
        alt="Rural Metal Traders"
        width={625}
        height={140}
        priority
        className={compact ? "h-9 w-auto max-w-[150px] object-contain" : "h-12 w-auto max-w-[240px] object-contain"}
      />
      {!compact ? <span className="sr-only">Clock-in and pre-starts</span> : null}
    </div>
  );
}
