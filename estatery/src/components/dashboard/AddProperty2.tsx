"use client";

/**
 * Add Property step 2 – Location (full address, city/region/zip, map).
 * Calls onLocationChange with combined string.
 */
import * as React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

type AddPropertyLocationStepProps = {
  location?: string;
  onLocationChange?: (location: string) => void;
};

export function AddPropertyLocationStep({
  location = "",
  onLocationChange,
}: AddPropertyLocationStepProps) {
  const [fullAddress, setFullAddress] = React.useState(
    location.split(" | ")[0] || ""
  );
  const [addressLength, setAddressLength] = React.useState(0);
  const [cityRegionZip, setCityRegionZip] = React.useState(
    location.split(" | ")[1] || ""
  );
  const [mapLocation, setMapLocation] = React.useState("");

  const handleFullAddressChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const v = e.target.value;
    setFullAddress(v);
    setAddressLength(Math.min(v.length, 200));
    const combined = cityRegionZip ? `${v} | ${cityRegionZip}` : v;
    onLocationChange?.(combined);
  };

  const handleCityRegionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setCityRegionZip(v);
    const combined = fullAddress ? `${fullAddress} | ${v}` : v;
    onLocationChange?.(combined);
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
        <Label htmlFor="city-region-zip" className="text-[#1e293b]">
          City / Region / Zip Code
        </Label>
        <Input
          id="city-region-zip"
          value={cityRegionZip}
          onChange={handleCityRegionChange}
          placeholder="Placeholder"
          className="border-[#e2e8f0] bg-white text-[#1e293b]"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="map-location" className="text-[#1e293b]">
          Map Location
        </Label>
        <Input
          id="map-location"
          value={mapLocation}
          onChange={(e) => setMapLocation(e.target.value)}
          placeholder="Placeholder"
          className="border-[#e2e8f0] bg-white text-[#1e293b]"
        />
      </div>
    </div>
  );
}

