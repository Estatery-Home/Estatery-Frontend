"use client";

/**
 * General settings – company name, industry, currency, address.
 * Uses SettingsContext.general / setGeneral; parent handles Save.
 */

import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSettings } from "@/contexts/SettingsContext";
import { api } from "@/lib/api-client";

export function General() {
  const { general, setGeneral } = useSettings();

  const [currencyOptions, setCurrencyOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [loadingCurrencies, setLoadingCurrencies] = useState(true);

  useEffect(() => {
    async function loadCurrencies() {
      try {
        const res = await fetch(api.endpoints.currencies);

        if (res.ok) {
          const data = await res.json();

          // 🔥 Normalize backend response (handles multiple formats)
          const formatted = data
            .map((c: any) => ({
              value: (c.value || c.code || "").toLowerCase(),
              label:
                c.label ||
                `${c.name || c.currency_name} (${c.code || c.value || ""})`,
            }))
            .filter((c: any) => c.value && c.label)
            .sort((a: any, b: any) => a.label.localeCompare(b.label));

          setCurrencyOptions(formatted);
        } else {
          console.error("Failed to fetch currencies");
        }
      } catch (err) {
        console.error("Failed to load currencies:", err);
      } finally {
        setLoadingCurrencies(false);
      }
    }

    loadCurrencies();
  }, []);

  return (
    <div className="space-y-0">
      {/* Account Details */}
      <section className="flex flex-col gap-6 pb-10 md:flex-row md:gap-8">
        <div className="shrink-0 md:w-56 lg:w-64">
          <h3 className="text-lg font-bold text-[#1e293b]">
            Account Details
          </h3>
          <p className="mt-1 text-sm text-[#64748b]">
            Your users will use this information to contact you.
          </p>
        </div>

        <div className="min-w-0 flex-1 grid grid-cols-1 gap-4">
          {/* Company Name */}
          <div className="space-y-2">
            <Label htmlFor="company-name" className="text-[#1e293b]">
              Company Name <span className="text-[#dc2626]">*</span>
            </Label>
            <Input
              id="company-name"
              value={general.companyName}
              onChange={(e) =>
                setGeneral((p) => ({
                  ...p,
                  companyName: e.target.value,
                }))
              }
              className="border-[#e2e8f0] bg-white text-[#1e293b]"
            />
          </div>

          {/* Industry */}
          <div className="space-y-2">
            <Label htmlFor="industry" className="text-[#1e293b]">
              Industry <span className="text-[#dc2626]">*</span>
            </Label>
            <Select
              value={general.industry}
              onValueChange={(v) =>
                setGeneral((p) => ({ ...p, industry: v }))
              }
            >
              <SelectTrigger className="border-[#e2e8f0] bg-white text-[#1e293b]">
                <SelectValue placeholder="Select industry" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="real-estate">Real Estate</SelectItem>
                <SelectItem value="retail">Retail</SelectItem>
                <SelectItem value="technology">Technology</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Currency */}
          <div className="space-y-2">
            <Label htmlFor="currency" className="text-[#1e293b]">
              Currency <span className="text-[#dc2626]">*</span>
            </Label>
            <Select
              value={general.currency}
              onValueChange={(v) =>
                setGeneral((p) => ({ ...p, currency: v }))
              }
            >
              <SelectTrigger className="border-[#e2e8f0] bg-white text-[#1e293b]">
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>

              <SelectContent>
                {loadingCurrencies ? (
                  <SelectItem value="loading" disabled>
                    Loading currencies...
                  </SelectItem>
                ) : currencyOptions.length > 0 ? (
                  currencyOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="none" disabled>
                    No currencies available
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      <hr className="border-t my-10 border-[#e2e8f0] -mx-6" />

      {/* Address */}
      <section className="flex flex-col gap-6 pt-10 md:flex-row md:gap-8">
        <div className="shrink-0 md:w-56 lg:w-64">
          <h3 className="text-lg font-bold text-[#1e293b]">Address</h3>
          <p className="mt-1 text-sm text-[#64748b]">
            This address will appear on your invoice.
          </p>
        </div>

        <div className="min-w-0 flex-1 space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {/* Address Name */}
            <div className="space-y-2">
              <Label htmlFor="address-name" className="text-[#1e293b]">
                Address Name <span className="text-[#dc2626]">*</span>
              </Label>
              <Input
                id="address-name"
                value={general.addressName}
                onChange={(e) =>
                  setGeneral((p) => ({
                    ...p,
                    addressName: e.target.value,
                  }))
                }
                className="border-[#e2e8f0] bg-white text-[#1e293b]"
              />
            </div>

            {/* Country */}
            <div className="space-y-2">
              <Label htmlFor="country" className="text-[#1e293b]">
                Country or Region <span className="text-[#dc2626]">*</span>
              </Label>
              <Select
                value={general.country}
                onValueChange={(v) =>
                  setGeneral((p) => ({ ...p, country: v }))
                }
              >
                <SelectTrigger className="border-[#e2e8f0] bg-white text-[#1e293b]">
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="us">United States</SelectItem>
                  <SelectItem value="uk">United Kingdom</SelectItem>
                  <SelectItem value="ca">Canada</SelectItem>
                  <SelectItem value="gh">Ghana</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* City */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="city" className="text-[#1e293b]">
                City <span className="text-[#dc2626]">*</span>
              </Label>
              <Input
                id="city"
                value={general.city}
                onChange={(e) =>
                  setGeneral((p) => ({ ...p, city: e.target.value }))
                }
                className="border-[#e2e8f0] bg-white text-[#1e293b]"
              />
            </div>
          </div>

          {/* Address + Postal */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_140px]">
            <div className="space-y-2">
              <Label htmlFor="address" className="text-[#1e293b]">
                Address <span className="text-[#dc2626]">*</span>
              </Label>
              <Input
                id="address"
                value={general.address}
                onChange={(e) =>
                  setGeneral((p) => ({
                    ...p,
                    address: e.target.value,
                  }))
                }
                className="border-[#e2e8f0] bg-white text-[#1e293b]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="postal-code" className="text-[#1e293b]">
                Postal Code <span className="text-[#dc2626]">*</span>
              </Label>
              <Input
                id="postal-code"
                value={general.postalCode}
                onChange={(e) =>
                  setGeneral((p) => ({
                    ...p,
                    postalCode: e.target.value,
                  }))
                }
                className="border-[#e2e8f0] bg-white text-[#1e293b]"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}