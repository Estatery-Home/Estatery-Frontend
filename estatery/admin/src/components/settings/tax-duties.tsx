"use client";

/**
 * Tax & Duties – full name, treaty country, residence, mailing.
 * Uses SettingsContext.tax / setTax; tax table for reference.
 */
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import * as React from "react";
import { useSettings } from "@/contexts/SettingsContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pagination } from "@/components/ui";

const TAX_ROWS = [
  { country: "United States", collecting: "Taxes", percentage: "20%", flag: "🇺🇸" },
  { country: "Rest of World", collecting: "-", percentage: "-", flag: "🌐" },
];

export function TaxDuties() {
  const { tax, setTax } = useSettings();
  const [page, setPage] = React.useState(1);
  const PAGE_SIZE = 10;
  const pageCount = Math.max(1, Math.ceil(TAX_ROWS.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const startIdx = (safePage - 1) * PAGE_SIZE;
  const pageRows = TAX_ROWS.slice(startIdx, startIdx + PAGE_SIZE);

  return (
    <div className="space-y-10">
      {/* Tax & Duties Overview */}
      <section className="flex flex-col gap-6 md:flex-row md:gap-8">
        <div className="shrink-0 md:w-56 lg:w-64">
          <h3 className="text-lg font-bold text-[#1e293b]">Tax & duties</h3>
          <p className="mt-1 text-sm text-[#64748b]">
            Review the taxes and duties associated with your purchases and subscriptions.
          </p>
        </div>
        <div className="min-w-0 flex-1">
          <div className="overflow-hidden rounded-lg border border-[#e2e8f0]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#e2e8f0] bg-[#f8fafc]">
                  <th className="px-4 py-3 text-left font-medium text-[#1e293b]">Country or Region</th>
                  <th className="px-4 py-3 text-left font-medium text-[#1e293b]">Collecting</th>
                  <th className="px-4 py-3 text-left font-medium text-[#1e293b]">Percentage</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((row) => (
                  <tr key={row.country} className="border-b border-[#e2e8f0] last:border-0">
                    <td className="flex items-center gap-2 px-4 py-3 text-[#1e293b]">
                      <span className="text-lg" aria-hidden>{row.flag}</span>
                      {row.country}
                    </td>
                    <td className="px-4 py-3 text-[#64748b]">{row.collecting}</td>
                    <td className="px-4 py-3 text-[#64748b]">{row.percentage}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination
              totalItems={TAX_ROWS.length}
              pageSize={PAGE_SIZE}
              currentPage={safePage}
              onPageChange={setPage}
              itemLabel="tax entries"
            />
          </div>
        </div>
      </section>

      <hr className="border-t border-[#e2e8f0]" />

      {/* Tax from Review */}
      <section className="flex flex-col gap-6 md:flex-row md:gap-8">
        <div className="shrink-0 md:w-56 lg:w-64">
          <h3 className="text-lg font-bold text-[#1e293b]">Tax from Review</h3>
          <p className="mt-1 text-sm text-[#64748b]">
            Manage where you collect taxes and duties. Check with a tax expert if you&apos;re unsure
            where you have a tax obligation.
          </p>
        </div>
        <div className="min-w-0 flex-1 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tax-full-name" className="text-[#1e293b]">
              Full Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="tax-full-name"
              value={tax.fullName}
              onChange={(e) => setTax((p) => ({ ...p, fullName: e.target.value }))}
              className="border-[#e2e8f0] bg-white text-[#1e293b]"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="treaty-country" className="text-[#1e293b]">
              Treaty Country <span className="text-red-500">*</span>
            </Label>
            <Select value={tax.treatyCountry} onValueChange={(v) => setTax((p) => ({ ...p, treatyCountry: v }))}>
              <SelectTrigger id="treaty-country" className="border-[#e2e8f0] bg-white text-[#1e293b]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="us">United States</SelectItem>
                <SelectItem value="uk">United Kingdom</SelectItem>
                <SelectItem value="ca">Canada</SelectItem>
                <SelectItem value="de">Germany</SelectItem>
                <SelectItem value="fr">France</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="permanent-residence" className="text-[#1e293b]">
              Permanent Residence <span className="text-red-500">*</span>
            </Label>
            <Input
              id="permanent-residence"
              value={tax.permanentResidence}
              onChange={(e) => setTax((p) => ({ ...p, permanentResidence: e.target.value }))}
              className="border-[#e2e8f0] bg-white text-[#1e293b]"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mailing-address" className="text-[#1e293b]">
              Mailing Address <span className="text-red-500">*</span>
            </Label>
            <Input
              id="mailing-address"
              value={tax.mailingAddress}
              onChange={(e) => setTax((p) => ({ ...p, mailingAddress: e.target.value }))}
              className="border-[#e2e8f0] bg-white text-[#1e293b]"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
