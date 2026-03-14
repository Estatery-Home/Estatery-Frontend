"use client";

/**
 * Add Property step 2 – Location (full address, city/region/zip, map).
 * Calls onLocationChange with combined string.
 */
import * as React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

/** API-aligned: address, city, country */
export type LocationData = {
  address: string;
  city: string;
  country: string;
};

type AddPropertyLocationStepProps = {
  address?: string;
  city?: string;
  country?: string;
  onLocationChange?: (data: LocationData) => void;
};

export function AddPropertyLocationStep({
  address: addressProp = "",
  city: cityProp = "",
  country: countryProp = "USA",
  onLocationChange,
}: AddPropertyLocationStepProps) {
  const [fullAddress, setFullAddress] = React.useState(addressProp);
  const [addressLength, setAddressLength] = React.useState(addressProp.length);
  const [city, setCity] = React.useState(cityProp);
  const [country, setCountry] = React.useState(countryProp);

  const notify = (a: string, c: string, co: string) =>
    onLocationChange?.({ address: a, city: c, country: co });

  const handleFullAddressChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const v = e.target.value;
    setFullAddress(v);
    setAddressLength(Math.min(v.length, 200));
    notify(v, city, country);
  };

  const handleCityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setCity(v);
    notify(fullAddress, v, country);
  };

  const handleCountryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setCountry(v);
    notify(fullAddress, city, v);
  };

  return (
    <div className="space-y-5">
      <h3 className="text-lg font-semibold text-[#1e293b]">Location Details</h3>

      <div className="space-y-2">
        <Label htmlFor="full-address" className="text-[#1e293b]">
          Full Address
        </Label>
        <textarea
          id="full-address"
          value={fullAddress}
          onChange={handleFullAddressChange}
          maxLength={200}
          rows={4}
          placeholder="Placeholder"
          className="w-full rounded-lg border border-[#e2e8f0] bg-white px-3 py-2 text-sm text-[#1e293b] placeholder:text-[#94a3b8] focus:border-[var(--logo)] focus:outline-none focus:ring-2 focus:ring-[var(--logo)]/20"
        />
        <p className="text-right text-xs text-[#64748b]">{addressLength}/200</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="city" className="text-[#1e293b]">
          City
        </Label>
        <Input
          id="city"
          value={city}
          onChange={handleCityChange}
          placeholder="e.g. Accra, New York"
          className="border-[#e2e8f0] bg-white text-[#1e293b]"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="country" className="text-[#1e293b]">
          Country
        </Label>
        <Input
          id="country"
          value={country}
          onChange={handleCountryChange}
          placeholder="e.g. Ghana, USA"
          className="border-[#e2e8f0] bg-white text-[#1e293b]"
        />
      </div>
    </div>
  );
}

