"use client";

/**
 * Add Property step 3 – bedrooms, bathrooms, optional area (Property model).
 */
import * as React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

type AddPropertyDetailsStepProps = {
  bedrooms?: number;
  bathrooms?: number;
  area?: number | null;
  onBedroomsChange?: (v: number) => void;
  onBathroomsChange?: (v: number) => void;
  onAreaChange?: (v: number | null) => void;
};

export function AddPropertyDetailsStep({
  bedrooms = 1,
  bathrooms = 1,
  area = 0,
  onBedroomsChange,
  onBathroomsChange,
  onAreaChange,
}: AddPropertyDetailsStepProps) {
  const [buildingArea, setBuildingArea] = React.useState(area ? String(area) : "");
  const [bedroomsVal, setBedroomsVal] = React.useState(bedrooms ? String(bedrooms) : "");
  const [bathroomsVal, setBathroomsVal] = React.useState(bathrooms ? String(bathrooms) : "");

  React.useEffect(() => {
    setBedroomsVal(bedrooms ? String(bedrooms) : "");
    setBathroomsVal(bathrooms ? String(bathrooms) : "");
    setBuildingArea(area ? String(area) : "");
  }, [bedrooms, bathrooms, area]);

  return (
    <div className="space-y-5">
      <h3 className="text-lg font-semibold text-[#1e293b]">Property Details</h3>
      <p className=" text-sm text-[#64748b]">Area is optional and stored in square meters when provided.</p>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="building-area" className="text-[#1e293b]">
            Area (sqm, optional)
          </Label>
          <Input
            id="building-area"
            type="number"
            min={0}
            value={buildingArea}
            onChange={(e) => {
              const v = e.target.value;
              setBuildingArea(v);
              const n = parseInt(v, 10);
              onAreaChange?.(isNaN(n) || n <= 0 ? null : n);
            }}
            placeholder="e.g. 185"
            className="border-[#e2e8f0] bg-white text-[#1e293b]"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="bedrooms" className="text-[#1e293b]">
            Bedrooms <span className="text-red-500">*</span>
          </Label>
          <Input
            id="bedrooms"
            type="number"
            min={1}
            value={bedroomsVal}
            onChange={(e) => {
              const v = e.target.value;
              setBedroomsVal(v);
              const n = parseInt(v, 10);
              onBedroomsChange?.(isNaN(n) ? 1 : n);
            }}
            placeholder="e.g. 3"
            className="border-[#e2e8f0] bg-white text-[#1e293b]"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="bathrooms" className="text-[#1e293b]">
            Bathrooms <span className="text-red-500">*</span>
          </Label>
          <Input
            id="bathrooms"
            type="number"
            min={1}
            value={bathroomsVal}
            onChange={(e) => {
              const v = e.target.value;
              setBathroomsVal(v);
              const n = parseInt(v, 10);
              onBathroomsChange?.(isNaN(n) ? 1 : n);
            }}
            placeholder="e.g. 2"
            className="border-[#e2e8f0] bg-white text-[#1e293b]"
            required
          />
        </div>
      </div>
    </div>
  );
}

