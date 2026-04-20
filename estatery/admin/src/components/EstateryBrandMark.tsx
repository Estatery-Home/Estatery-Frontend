"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

type EstateryBrandMarkProps = {
  /** Pixel size of the square mark */
  size?: number;
  className?: string;
};

/** Project home logo — same asset as sidebar and marketing (`/images/HomeLogo.webp`). */
export function EstateryBrandMark({ size = 40, className }: EstateryBrandMarkProps) {
  const s = Math.max(24, size);
  return (
    <span
      className={cn(
        "inline-flex shrink-0 overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200/80",
        className
      )}
      aria-hidden
    >
      <Image src="/images/HomeLogo.webp" alt="" width={s} height={s} className="object-contain p-0.5" />
    </span>
  );
}
