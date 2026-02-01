"use client";

import * as React from "react";
import { DashboardLayout } from "@/components/dashboard";

type PlaceholderPageProps = {
  title: string;
  description?: string;
};

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <DashboardLayout>
      <div className="mx-auto max-w-4xl">
        <h1 className="text-2xl font-bold text-[#1e293b]">{title}</h1>
        {description && <p className="mt-2 text-[#64748b]">{description}</p>}
        <p className="mt-6 text-sm text-[#94a3b8]">This page is under construction.</p>
      </div>
    </DashboardLayout>
  );
}
