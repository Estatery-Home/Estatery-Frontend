"use client";

import * as React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

type AddPropertyDetailsStepProps = {
  beds?: number;
  baths?: number;
  sqft?: string;
  onBedsChange?: (v: number | undefined) => void;
  onBathsChange?: (v: number | undefined) => void;
  onSqftChange?: (v: string | undefined) => void;
};

// Step 3: Property Details
export function AddPropertyDetailsStep({
  beds,
  baths,
  sqft,
  onBedsChange,
  onBathsChange,
  onSqftChange,
}: AddPropertyDetailsStepProps = {}) {
  const [landArea, setLandArea] = React.useState("");
  const [buildingArea, setBuildingArea] = React.useState(sqft ?? "");
  const [bedrooms, setBedrooms] = React.useState(beds != null ? String(beds) : "");
  const [bathrooms, setBathrooms] = React.useState(baths != null ? String(baths) : "");
  const [floors, setFloors] = React.useState("");
  const [yearBuilt, setYearBuilt] = React.useState("");
  const [furnishing, setFurnishing] = React.useState("");
  const [parkingSpaces, setParkingSpaces] = React.useState("");

  return (
    <div className="space-y-5">
      <h3 className="text-lg font-semibold text-[#1e293b]">Property Details</h3>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="land-area" className="text-[#1e293b]">
            Land Area (m²)
          </Label>
          <Input
            id="land-area"
            value={landArea}
            onChange={(e) => setLandArea(e.target.value)}
            placeholder="Placeholder"
            className="border-[#e2e8f0] bg-white text-[#1e293b]"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="building-area" className="text-[#1e293b]">
            Building Area (m²)
          </Label>
          <Input
            id="building-area"
            value={buildingArea}
            onChange={(e) => {
              setBuildingArea(e.target.value);
              onSqftChange?.(e.target.value || undefined);
            }}
            placeholder="Placeholder"
            className="border-[#e2e8f0] bg-white text-[#1e293b]"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="bedrooms" className="text-[#1e293b]">
            Bedrooms
          </Label>
          <Input
            id="bedrooms"
            value={bedrooms}
            onChange={(e) => {
              setBedrooms(e.target.value);
              const n = parseInt(e.target.value, 10);
              onBedsChange?.(isNaN(n) ? undefined : n);
            }}
            placeholder="Placeholder"
            className="border-[#e2e8f0] bg-white text-[#1e293b]"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="bathrooms" className="text-[#1e293b]">
            Bathrooms
          </Label>
          <Input
            id="bathrooms"
            value={bathrooms}
            onChange={(e) => {
              setBathrooms(e.target.value);
              const n = parseInt(e.target.value, 10);
              onBathsChange?.(isNaN(n) ? undefined : n);
            }}
            placeholder="Placeholder"
            className="border-[#e2e8f0] bg-white text-[#1e293b]"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="floors" className="text-[#1e293b]">
            Floors
          </Label>
          <Input
            id="floors"
            value={floors}
            onChange={(e) => setFloors(e.target.value)}
            placeholder="Placeholder"
            className="border-[#e2e8f0] bg-white text-[#1e293b]"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="year-built" className="text-[#1e293b]">
            Year Built
          </Label>
          <Input
            id="year-built"
            value={yearBuilt}
            onChange={(e) => setYearBuilt(e.target.value)}
            placeholder="Placeholder"
            className="border-[#e2e8f0] bg-white text-[#1e293b]"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="furnishing" className="text-[#1e293b]">
            Furnishing
          </Label>
          <Input
            id="furnishing"
            value={furnishing}
            onChange={(e) => setFurnishing(e.target.value)}
            placeholder="Placeholder"
            className="border-[#e2e8f0] bg-white text-[#1e293b]"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="parking-spaces" className="text-[#1e293b]">
            Parking Spaces
          </Label>
          <Input
            id="parking-spaces"
            value={parkingSpaces}
            onChange={(e) => setParkingSpaces(e.target.value)}
            placeholder="Placeholder"
            className="border-[#e2e8f0] bg-white text-[#1e293b]"
          />
        </div>
      </div>
    </div>
  );
}

