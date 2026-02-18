"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, MoreVertical, Download, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { Pagination } from "@/components/ui";

const PAYMENT_METHODS = [
  { brand: "MasterCard", last4: "1573", expiry: "05/27", isPrimary: true },
  { brand: "VISA", last4: "7228", expiry: "10/26", isPrimary: false },
];

const INVOICES = [
  { id: "018298", date: "Jan 20, 2025", plan: "Pro Plan", amount: "₵79" },
  { id: "015274", date: "Feb 20, 2025", plan: "Basic Plan", amount: "₵29" },
];

export function PaymentBilling() {
  const [email, setEmail] = useState("robertjohnson@gmail.com");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;
  const pageCount = Math.max(1, Math.ceil(INVOICES.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const startIdx = (safePage - 1) * PAGE_SIZE;
  const pageInvoices = INVOICES.slice(startIdx, startIdx + PAGE_SIZE);

  return (
    <div className="space-y-10">
      {/* Payment */}
      <section className="flex flex-col gap-6 md:flex-row md:gap-8">
        <div className="shrink-0 md:w-56 lg:w-64">
          <h3 className="text-lg font-bold text-[#1e293b]">Payment</h3>
          <p className="mt-1 text-sm text-[#64748b]">
            Manage your payment methods securely. Add, update, or remove your credit/debit cards.
          </p>
        </div>
        <div className="min-w-0 flex-1 space-y-4">
          {PAYMENT_METHODS.map((card) => (
            <div
              key={card.last4}
              className="group relative overflow-hidden flex items-center justify-between rounded-xl border border-[#e2e8f0] bg-white p-4 shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-[1.01] hover:border-[#cbd5e1] hover:shadow-lg active:scale-[1.005]"
            >
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-600 ease-out group-hover:translate-x-full" />
              <div className="relative flex items-center gap-4">
                <div className="flex h-12 w-16 items-center justify-center rounded-lg bg-[#f1f5f9] text-lg font-bold text-[#1e293b]">
                  {card.brand.slice(0, 2)}
                </div>
                <div>
                  <p className="font-medium text-[#1e293b]">
                    {card.brand} •••• {card.last4}
                  </p>
                  <p className="text-sm text-[#64748b]">Expires {card.expiry}</p>
                </div>
                {card.isPrimary && (
                  <div className="flex items-center gap-1.5 rounded-full bg-[var(--logo-muted)] px-2.5 py-1 text-sm font-medium text-[var(--logo)]">
                    <Check className="size-4" strokeWidth={2.5} />
                    Primary
                  </div>
                )}
              </div>
              <button
                type="button"
                className="rounded-lg p-2 text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#1e293b]"
                aria-label="Card options"
              >
                <MoreVertical className="size-5" />
              </button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            className="border-[#e2e8f0] text-[#1e293b] hover:bg-[#f8fafc]"
          >
            Add Payment Method
          </Button>
        </div>
      </section>

      <hr className="border-t border-[#e2e8f0]" />

      {/* Billing */}
      <section className="flex flex-col gap-6 md:flex-row md:gap-8">
        <div className="shrink-0 md:w-56 lg:w-64">
          <h3 className="text-lg font-bold text-[#1e293b]">Billing</h3>
          <p className="mt-1 text-sm text-[#64748b]">
            Review and update your billing information to ensure accurate and timely payments.
          </p>
        </div>
        <div className="min-w-0 flex-1 space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-[#64748b]">Next billing on March 18, 2025</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-[#e2e8f0] text-[#1e293b] hover:bg-[#f8fafc]"
            >
              Change Billing Period
            </Button>
            <button
              type="button"
              className="rounded-lg p-2 text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#1e293b]"
              aria-label="Billing notifications"
            >
              <Bell className="size-5" />
            </button>
          </div>

          <div className="group relative overflow-hidden rounded-xl border border-[#e2e8f0] bg-white p-5 shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-[1.01] hover:border-[#cbd5e1] hover:shadow-lg active:scale-[1.005]">
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-600 ease-out group-hover:translate-x-full" />
            <div className="relative flex flex-wrap items-start justify-between gap-4">
              <div>
                <h4 className="font-semibold text-[#1e293b]">Basic Plan</h4>
                <p className="mt-1 text-2xl font-bold text-[#1e293b]">₵29 <span className="text-sm font-normal text-[#64748b]">/month</span></p>
                <p className="mt-2 text-sm text-[#64748b]">All the basics for starting a new business</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0 border-[#e2e8f0] text-[#1e293b] hover:bg-[#f8fafc]"
              >
                Downgrade
              </Button>
            </div>
            <Button
              type="button"
              className="relative mt-4 bg-[var(--logo)] text-white hover:bg-[var(--logo-hover)]"
            >
              Change Plan
            </Button>
          </div>

          <div>
            <h4 className="mb-3 font-semibold text-[#1e293b]">Invoice History</h4>
            <div className="overflow-hidden rounded-lg border border-[#e2e8f0]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#e2e8f0] bg-[#f8fafc]">
                    <th className="px-4 py-3 text-left font-medium text-[#1e293b]">Invoice #</th>
                    <th className="px-4 py-3 text-left font-medium text-[#1e293b]">Date</th>
                    <th className="px-4 py-3 text-left font-medium text-[#1e293b]">Plan</th>
                    <th className="px-4 py-3 text-left font-medium text-[#1e293b]">Amount</th>
                    <th className="w-10 px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {pageInvoices.map((inv) => (
                    <tr key={inv.id} className="border-b border-[#e2e8f0] last:border-0">
                      <td className="px-4 py-3 text-[#1e293b]">#{inv.id}</td>
                      <td className="px-4 py-3 text-[#64748b]">{inv.date}</td>
                      <td className="px-4 py-3 text-[#64748b]">{inv.plan}</td>
                      <td className="px-4 py-3 font-medium text-[#1e293b]">{inv.amount}</td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          className="rounded p-1.5 text-[#64748b] hover:bg-[#f1f5f9] hover:text-[var(--logo)]"
                          aria-label={`Download invoice ${inv.id}`}
                        >
                          <Download className="size-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Pagination
                totalItems={INVOICES.length}
                pageSize={PAGE_SIZE}
                currentPage={safePage}
                onPageChange={setPage}
                itemLabel="invoices"
              />
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold text-[#1e293b]">Email address</h4>
            <p className="text-sm text-[#64748b]">Invoice will be sent to this email address.</p>
            <div className="max-w-md">
              <Label htmlFor="billing-email" className="text-[#1e293b]">
                Email Address <span className="text-red-500">*</span>
              </Label>
              <Input
                id="billing-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 border-[#e2e8f0] bg-white text-[#1e293b]"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
