"use client";

/**
 * Add Property step 5 – rental settings & amenities (matches Property model / serializer).
 */
import * as React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PropertyCurrencyApi } from "@/lib/properties";

export type AddPropertyRentalForm = {
  currency: PropertyCurrencyApi;
  monthly_cycle_start: number;
  security_deposit_months: number;
  max_stay_months: string;
  has_wifi: boolean;
  has_parking: boolean;
  has_pool: boolean;
  has_gym: boolean;
  is_furnished: boolean;
  has_kitchen: boolean;
};

type AddPropertyRentalStepProps = {
  value: AddPropertyRentalForm;
  onChange: (next: AddPropertyRentalForm) => void;
};

export function AddPropertyRentalStep({ value, onChange }: AddPropertyRentalStepProps) {
  const patch = (partial: Partial<AddPropertyRentalForm>) => onChange({ ...value, ...partial });

  return (
    <div className="space-y-5">
      <h3 className="text-lg font-semibold text-[#1e293b]">Rental settings &amp; amenities</h3>
      <p className="text-sm text-[#64748b]">
        These fields map to your listing on the server (currency, billing cycle, deposit, amenities).
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="currency" className="text-[#1e293b]">
            Currency
          </Label>
          <Select
            value={value.currency}
            onValueChange={(v) => patch({ currency: v as PropertyCurrencyApi })}
          >
            <SelectTrigger id="currency" className="border-[#e2e8f0] bg-white text-[#1e293b]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ghs">GHS</SelectItem>
              <SelectItem value="usd">USD</SelectItem>
              <SelectItem value="cfa">CFA</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="cycle-start" className="text-[#1e293b]">
            Monthly cycle start (day 1–28)
          </Label>
          <Input
            id="cycle-start"
            type="number"
            min={1}
            max={28}
            value={value.monthly_cycle_start}
            onChange={(e) => {
              const n = parseInt(e.target.value, 10);
              patch({
                monthly_cycle_start: Number.isNaN(n) ? 1 : Math.min(28, Math.max(1, n)),
              });
            }}
            className="border-[#e2e8f0] bg-white text-[#1e293b]"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="deposit-months" className="text-[#1e293b]">
            Security deposit (months of rent)
          </Label>
          <Input
            id="deposit-months"
            type="number"
            min={0}
            step={0.5}
            value={value.security_deposit_months}
            onChange={(e) => {
              const n = parseFloat(e.target.value);
              patch({ security_deposit_months: Number.isNaN(n) ? 2 : n });
            }}
            className="border-[#e2e8f0] bg-white text-[#1e293b]"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="max-stay" className="text-[#1e293b]">
            Max stay (months, optional)
          </Label>
          <Input
            id="max-stay"
            type="number"
            min={1}
            placeholder="Leave empty for no max"
            value={value.max_stay_months}
            onChange={(e) => patch({ max_stay_months: e.target.value })}
            className="border-[#e2e8f0] bg-white text-[#1e293b]"
          />
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#64748b]">Amenities</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {(
            [
              ["has_wifi", "WiFi"],
              ["has_parking", "Parking"],
              ["has_pool", "Pool"],
              ["has_gym", "Gym"],
              ["is_furnished", "Furnished"],
              ["has_kitchen", "Kitchen"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="flex cursor-pointer items-center gap-2 text-sm text-[#1e293b]">
              <input
                type="checkbox"
                className="size-4 rounded border-[#e2e8f0] text-[var(--logo)]"
                checked={Boolean(value[key])}
                onChange={(e) => patch({ [key]: e.target.checked } as Partial<AddPropertyRentalForm>)}
              />
              {label}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
