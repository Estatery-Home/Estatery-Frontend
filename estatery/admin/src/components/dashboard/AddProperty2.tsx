"use client";

/**
 * Add Property step 2 – Location (address, city, state, country, zip) — API-aligned.
 */
import * as React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export type LocationData = {
  address: string;
  city: string;
  country: string;
  state: string;
  zip_code: string;
};

const emptyLocation: LocationData = {
  address: "",
  city: "",
  country: "",
  state: "",
  zip_code: "",
};

type AddPropertyLocationStepProps = {
  address?: string;
  city?: string;
  country?: string;
  state?: string;
  zip_code?: string;
  availableCountries?: string[];
  onLocationChange?: (data: LocationData) => void;
};

export function AddPropertyLocationStep({
  address: addressProp = "",
  city: cityProp = "",
  country: countryProp = "",
  state: stateProp = "",
  zip_code: zipProp = "",
  availableCountries = [],
  onLocationChange,
}: AddPropertyLocationStepProps) {
  const [loc, setLoc] = React.useState<LocationData>({
    address: addressProp,
    city: cityProp,
    country: countryProp || "Ghana",
    state: stateProp,
    zip_code: zipProp,
  });

  React.useEffect(() => {
    setLoc({
      address: addressProp,
      city: cityProp,
      country: countryProp || "Ghana",
      state: stateProp,
      zip_code: zipProp,
    });
  }, [addressProp, cityProp, countryProp, stateProp, zipProp]);

  const notify = (next: LocationData) => {
    setLoc(next);
    onLocationChange?.(next);
  };

  return (
    <div className="space-y-5">
      <h3 className="text-lg font-semibold text-[#1e293b]">Location Details</h3>

      <div className="space-y-2">
        <Label htmlFor="full-address" className="text-[#1e293b]">
          Street address <span className="text-red-500">*</span>
        </Label>
        <textarea
          id="full-address"
          value={loc.address}
          onChange={(e) => notify({ ...loc, address: e.target.value.slice(0, 255) })}
          maxLength={255}
          rows={3}
          placeholder="Street, building, area"
          className="w-full rounded-lg border border-[#e2e8f0] bg-white px-3 py-2 text-sm text-[#1e293b] placeholder:text-[#94a3b8] focus:border-[var(--logo)] focus:outline-none focus:ring-2 focus:ring-[var(--logo)]/20"
          required
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="city" className="text-[#1e293b]">
            City <span className="text-red-500">*</span>
          </Label>
          <Input
            id="city"
            value={loc.city}
            onChange={(e) => notify({ ...loc, city: e.target.value })}
            placeholder="e.g. Accra"
            className="border-[#e2e8f0] bg-white text-[#1e293b]"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="country" className="text-[#1e293b]">
            Country <span className="text-red-500">*</span>
          </Label>
          {availableCountries.length > 0 ? (
            <select
              id="country"
              value={loc.country}
              onChange={(e) => notify({ ...loc, country: e.target.value })}
              className="flex h-10 w-full rounded-lg border border-[#e2e8f0] bg-white px-3 py-2 text-sm text-[#1e293b] focus:border-[var(--logo)] focus:outline-none focus:ring-2 focus:ring-[var(--logo)]/20"
              required
            >
              {availableCountries.map((countryName) => (
                <option key={countryName} value={countryName}>
                  {countryName}
                </option>
              ))}
            </select>
          ) : (
            <Input
              id="country"
              value={loc.country}
              onChange={(e) => notify({ ...loc, country: e.target.value })}
              placeholder="e.g. Ghana"
              className="border-[#e2e8f0] bg-white text-[#1e293b]"
              required
            />
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="state" className="text-[#1e293b]">
            State / region
          </Label>
          <Input
            id="state"
            value={loc.state}
            onChange={(e) => notify({ ...loc, state: e.target.value })}
            placeholder="Optional"
            className="border-[#e2e8f0] bg-white text-[#1e293b]"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="zip" className="text-[#1e293b]">
            Postal / ZIP code
          </Label>
          <Input
            id="zip"
            value={loc.zip_code}
            onChange={(e) => notify({ ...loc, zip_code: e.target.value })}
            placeholder="Optional"
            className="border-[#e2e8f0] bg-white text-[#1e293b]"
          />
        </div>
      </div>
    </div>
  );
}

export { emptyLocation };
