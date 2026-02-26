"use client";

/**
 * Add Property step 3 – Property details (beds, baths, sqft, land area, etc.).
 * Calls onBedsChange, onBathsChange, onSqftChange when provided.
 */
import * as React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

/** API-aligned: bedrooms, bathrooms, area (m² or sqft) */
type AddPropertyDetailsStepProps = {
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
  onBedroomsChange?: (v: number) => void;
  onBathroomsChange?: (v: number) => void;
  onAreaChange?: (v: number) => void;
};

export function AddPropertyDetailsStep({
  bedrooms = 0,
  bathrooms = 0,
  area = 0,
  onBedroomsChange,
  onBathroomsChange,
  onAreaChange,
}: AddPropertyDetailsStepProps = {}) {
  const [landArea, setLandArea] = React.useState("");
  const [buildingArea, setBuildingArea] = React.useState(area ? String(area) : "");
  const [bedroomsVal, setBedroomsVal] = React.useState(bedrooms ? String(bedrooms) : "");
  const [bathroomsVal, setBathroomsVal] = React.useState(bathrooms ? String(bathrooms) : "");
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
            Area (m² / sq ft)
          </Label>
          <Input
            id="building-area"
            type="number"
            value={buildingArea}
            onChange={(e) => {
              const v = e.target.value;
              setBuildingArea(v);
              const n = parseInt(v, 10);
              onAreaChange?.(isNaN(n) ? 0 : n);
            }}
            placeholder="e.g. 2000"
            className="border-[#e2e8f0] bg-white text-[#1e293b]"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="bedrooms" className="text-[#1e293b]">
            Bedrooms
          </Label>
          <Input
            id="bedrooms"
            type="number"
            value={bedroomsVal}
            onChange={(e) => {
              const v = e.target.value;
              setBedroomsVal(v);
              const n = parseInt(v, 10);
              onBedroomsChange?.(isNaN(n) ? 0 : n);
            }}
            placeholder="e.g. 3"
            className="border-[#e2e8f0] bg-white text-[#1e293b]"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="bathrooms" className="text-[#1e293b]">
            Bathrooms
          </Label>
          <Input
            id="bathrooms"
            type="number"
            value={bathroomsVal}
            onChange={(e) => {
              const v = e.target.value;
              setBathroomsVal(v);
              const n = parseInt(v, 10);
              onBathroomsChange?.(isNaN(n) ? 0 : n);
            }}
            placeholder="e.g. 2"
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

