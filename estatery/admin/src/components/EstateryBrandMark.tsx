"use client";

import { Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

type EstateryBrandMarkProps = {
  /** Pixel size of the square mark */
  size?: number;
  className?: string;
};

/**
 * App mark — building icon on brand gradient (replaces generic home image for admin shell).
 */
export function EstateryBrandMark({ size = 40, className }: EstateryBrandMarkProps) {
  const icon = Math.max(14, Math.round(size * 0.52));
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--logo)] to-[#1e40af] shadow-md shadow-[var(--logo)]/25 ring-1 ring-white/30",
        className
      )}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <Building2 width={icon} height={icon} className="text-white" strokeWidth={2.2} />
    </div>
  );
}
