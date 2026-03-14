"use client";

import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const PLANS = [
  {
    name: "Basic Plan",
    price: 24,
    description: "All the basics for starting a new business",
    features: [
      "Up to 2 staff members",
      "Up to 4 locations",
      "Fraud analysis",
      "Professional reports",
    ],
    action: "Downgrade",
    actionVariant: "outline",
  },
  {
    name: "Pro Plan",
    price: 64,
    description: "Everything you need for a growing business",
    features: [
      "Up to 5 staff members",
      "Up to 5 locations",
      "Fraud analysis",
      "Professional reports",
    ],
    action: "Current Plan",
    actionVariant: "outline",
    isCurrent: true,
  },
  {
    name: "Advanced Plan",
    price: 124,
    description: "Advanced features for scaling your business",
    features: [
      "Up to 10 staff members",
      "Up to 8 locations",
      "Fraud analysis",
      "Professional reports",
    ],
    action: "Free Trial - 30 Days",
    actionVariant: "default",
  },
];

export function PlanPricing() {
  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-bold text-[#1e293b]">Plan & Pricing</h3>
        <p className="mt-1 text-sm text-[#64748b]">
          Manage your subscription plans. Choose a plan that best suits your needs, compare
          features, and adjust your subscription as needed.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        {PLANS.map((plan) => (
          <div
            key={plan.name}
            className={cn(
              "group relative overflow-hidden flex flex-col rounded-xl border bg-white p-6 shadow-sm transition-all duration-300 ease-out hover:-translate-y-1.5 hover:scale-[1.02] hover:shadow-xl active:scale-[1.01]",
              plan.isCurrent ? "border-[var(--logo)] ring-2 ring-[var(--logo)]/20" : "border-[#e2e8f0] hover:border-[#cbd5e1]"
            )}
          >
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full" />
            <div className="relative flex flex-wrap items-start justify-between gap-2">
              <div>
                <h4 className="font-semibold text-[#1e293b]">{plan.name}</h4>
                <p className="mt-1 text-2xl font-bold text-[#1e293b]">
                  ₵{plan.price}{" "}
                  <span className="text-sm font-normal text-[#64748b]">/ month</span>
                </p>
              </div>
              <Button
                type="button"
                variant={plan.actionVariant}
                size="sm"
                className={cn(
                  "shrink-0",
                  plan.isCurrent && "bg-[var(--logo-muted)] text-[var(--logo)] hover:bg-[var(--logo-muted)]"
                )}
              >
                {plan.action}
              </Button>
            </div>
            <p className="relative mt-3 text-sm text-[#64748b]">{plan.description}</p>
            <ul className="relative mt-6 space-y-3">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm text-[#1e293b]">
                  <Check className="size-4 shrink-0 text-[var(--logo)]" strokeWidth={2.5} />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
