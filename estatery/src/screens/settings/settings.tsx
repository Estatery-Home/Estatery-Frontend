"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { General } from "@/components/settings/general";
import { MyAccount } from "@/components/settings/myaccount";
import { Links } from "@/components/settings/links";
import { TimeLang } from "@/components/settings/time_lang";

const SETTINGS_NAV = [
  { id: "general", label: "General" },
  { id: "plan-pricing", label: "Plan & Pricing" },
  { id: "my-account", label: "My Account" },
  { id: "payment-billing", label: "Payment & Billing" },
  { id: "tax-duties", label: "Tax & Duties" },
  { id: "link-account", label: "Link Account" },
  { id: "time-language", label: "Time & Language" },
  { id: "password", label: "Password" },
  { id: "notifications", label: "Notifications" },
] as const;

export default function Settings() {
  const [activeSection, setActiveSection] = useState<string>("general");

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header: Title + Cancel / Save Change */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-[#1e293b]">Settings</h1>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            className="border-[#e2e8f0] bg-white text-[#1e293b] hover:bg-[#f8fafc]"
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="bg-[#21438D] text-white hover:bg-[#1a3580]"
          >
            Save Change
          </Button>
        </div>
      </div>

      {/* Layout: one panel – light grey sidebar (distinct items) + vertical divider + white content */}
      <div className="flex flex-col overflow-hidden rounded-xl border border-[#e2e8f0] bg-white shadow-sm lg:flex-row">
        {/* Settings navigation – light grey background, distinct entries (no inner card) */}
        <nav
          className="w-full shrink-0 border-b border-[#e2e8f0] bg-[#f1f5f9] lg:w-56 lg:border-b-0 lg:border-r lg:border-r-[#e2e8f0]"
          aria-label="Settings sections"
        >
          <ul className="p-2 space-y-0.5">
            {SETTINGS_NAV.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => setActiveSection(item.id)}
                    className={cn(
                      "relative w-full rounded-md px-3 py-2.5 text-left text-sm font-medium transition-colors",
                      isActive
                        ? "bg-[#e0f2fe] text-[#1e293b] border-l-[3px] border-l-[#21438D] pl-[calc(0.75rem+3px)]"
                        : "text-[#64748b] hover:bg-[#e2e8f0] hover:text-[#1e293b]"
                    )}
                  >
                    {item.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Main content (right) – white, separated by vertical divider */}
        <div className="min-w-0 flex-1 bg-white p-6">
          {activeSection === "general" && <General />}
          {activeSection === "my-account" &&  <MyAccount />} 
          {activeSection === "link-account" &&  <Links />} 
          {activeSection === "time-language" &&  <TimeLang />}  
          
        </div>
      </div>
    </div>
  );
}
