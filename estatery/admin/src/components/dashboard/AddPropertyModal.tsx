"use client";

/**
 * Multi-step Add Property modal — fields aligned with PropertySerializer / Property model.
 */
import * as React from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { Property } from "@/lib/properties";
import { PROPERTY_TYPES, LISTING_TYPES, PROPERTY_CONDITIONS } from "@/lib/properties";
import { createProperty, fetchCountries, uploadPropertyImage, uploadPropertyVideo } from "@/lib/api-client";
import { AddPropertyLocationStep, emptyLocation, type LocationData } from "./AddProperty2";
import { AddPropertyDetailsStep } from "./AddProperty3";
import { AddPropertyMediaStep, MAX_PROPERTY_IMAGES } from "./AddProperty4";
import { AddPropertyRentalStep, type AddPropertyRentalForm } from "./AddProperty5";

const STEPS = [
  { id: 1, label: "Basic Information" },
  { id: 2, label: "Location" },
  { id: 3, label: "Property Details" },
  { id: 4, label: "Photos" },
  { id: 5, label: "Rental & amenities" },
] as const;

const RENTAL_MIN_MONTHS: Record<string, number> = {
  "6 months": 6,
  "1 year": 12,
  "2 years": 24,
  "3 years": 36,
};

const defaultRentalForm = (): AddPropertyRentalForm => ({
  currency: "ghs",
  monthly_cycle_start: 1,
  security_deposit_months: 2,
  max_stay_months: "",
  has_wifi: false,
  has_parking: false,
  has_pool: false,
  has_gym: false,
  is_furnished: false,
  has_kitchen: true,
  has_prepaid_meter: false,
  has_postpaid_meter: false,
  has_24h_electricity: false,
  has_kitchen_cabinets: false,
  has_dining_area: false,
  custom_facilities: "",
});

type AddPropertyModalProps = {
  open: boolean;
  onClose: () => void;
  /** Called after a successful API create — refetch listings in parent */
  onPropertyAdded?: () => void;
};

export function AddPropertyModal({ open, onClose, onPropertyAdded }: AddPropertyModalProps) {
  const [step, setStep] = React.useState(1);
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [propertyType, setPropertyType] = React.useState<Property["property_type"]>("house");
  const [propertyCondition, setPropertyCondition] = React.useState<Property["property_condition"]>("fairly_used");
  const [listingType, setListingType] = React.useState<"rent" | "sale">("rent");
  const [price, setPrice] = React.useState("");
  const [rentalPeriod, setRentalPeriod] = React.useState("1 year");
  const [showSaveDialog, setShowSaveDialog] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [saveError, setSaveError] = React.useState<string | null>(null);
  const [location, setLocation] = React.useState<LocationData>({ ...emptyLocation, country: "Ghana" });
  const [bedrooms, setBedrooms] = React.useState(3);
  const [bathrooms, setBathrooms] = React.useState(2);
  const [area, setArea] = React.useState<number | null>(null);
  const [photoFiles, setPhotoFiles] = React.useState<File[]>([]);
  const [videoFile, setVideoFile] = React.useState<File | null>(null);
  const [primaryPhotoIndex, setPrimaryPhotoIndex] = React.useState(0);
  const [rentalForm, setRentalForm] = React.useState<AddPropertyRentalForm>(defaultRentalForm);
  const [countries, setCountries] = React.useState<string[]>(["Ghana"]);

  const resetForm = React.useCallback(() => {
    setStep(1);
    setTitle("");
    setDescription("");
    setPropertyType("house");
    setPropertyCondition("fairly_used");
    setListingType("rent");
    setPrice("");
    setRentalPeriod("1 year");
    setLocation({ ...emptyLocation, country: "Ghana" });
    setBedrooms(3);
    setBathrooms(2);
    setArea(null);
    setPhotoFiles([]);
    setVideoFile(null);
    setPrimaryPhotoIndex(0);
    setRentalForm(defaultRentalForm());
    setSaveError(null);
    setShowSaveDialog(false);
  }, []);

  const wasOpen = React.useRef(false);
  React.useEffect(() => {
    if (open && !wasOpen.current) resetForm();
    wasOpen.current = open;
  }, [open, resetForm]);

  React.useEffect(() => {
    let cancelled = false;
    const loadCountries = async () => {
      const list = await fetchCountries();
      if (cancelled || list.length === 0) return;
      setCountries(list);
      setLocation((prev) => ({
        ...prev,
        country: list.includes(prev.country) ? prev.country : list[0],
      }));
    };
    void loadCountries();
    return () => {
      cancelled = true;
    };
  }, []);

  const canContinue = () => {
    switch (step) {
      case 1:
        return !!(title.trim() && description.trim() && price.trim());
      case 2:
        return !!(location.address.trim() && location.city.trim() && location.country.trim());
      case 3:
        return bedrooms > 0 && bathrooms > 0;
      case 4:
        return true;
      case 5:
        return (
          rentalForm.monthly_cycle_start >= 1 &&
          rentalForm.monthly_cycle_start <= 28 &&
          rentalForm.security_deposit_months >= 0
        );
      default:
        return true;
    }
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(e.target.value.slice(0, 200));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);
    const priceVal = price.replace(/[^\d.]/g, "") || "0";
    const monthlyNum = parseFloat(priceVal);
    const dailyPrice = (monthlyNum / 30.44).toFixed(2);
    const minStay =
      listingType === "sale"
        ? 12
        : (RENTAL_MIN_MONTHS[rentalPeriod] ?? 12);
    let maxStay: number | undefined;
    if (rentalForm.max_stay_months.trim()) {
      const m = parseInt(rentalForm.max_stay_months, 10);
      if (!Number.isNaN(m) && m > 0) maxStay = m;
    }
    const customFacilities = rentalForm.custom_facilities
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    try {
      const created = await createProperty({
        title: title.trim(),
        description: description.trim() || "—",
        address: location.address.trim(),
        city: location.city.trim(),
        country: location.country.trim(),
        state: location.state.trim() || "Optional",
        zip_code: location.zip_code.trim() || undefined,
        property_type: propertyType,
        listing_type: listingType,
        property_condition: propertyCondition,
        daily_price: dailyPrice,
        monthly_price: priceVal,
        currency: rentalForm.currency,
        bedrooms,
        bathrooms,
        area,
        min_stay_months: minStay,
        max_stay_months: maxStay,
        monthly_cycle_start: rentalForm.monthly_cycle_start,
        security_deposit_months: rentalForm.security_deposit_months,
        has_wifi: rentalForm.has_wifi,
        has_parking: rentalForm.has_parking,
        has_pool: rentalForm.has_pool,
        has_gym: rentalForm.has_gym,
        is_furnished: rentalForm.is_furnished,
        has_kitchen: rentalForm.has_kitchen,
        has_prepaid_meter: rentalForm.has_prepaid_meter,
        has_postpaid_meter: rentalForm.has_postpaid_meter,
        has_24h_electricity: rentalForm.has_24h_electricity,
        has_kitchen_cabinets: rentalForm.has_kitchen_cabinets,
        has_dining_area: rentalForm.has_dining_area,
        custom_facilities: customFacilities,
      });

      const rawId = (created.property as { id?: unknown })?.id;
      const propertyId = typeof rawId === "number" ? rawId : Number(rawId);
      if (Number.isFinite(propertyId) && photoFiles.length > 0) {
        const capped = photoFiles.slice(0, MAX_PROPERTY_IMAGES);
        const n = capped.length;
        const pi = Math.min(Math.max(0, primaryPhotoIndex), n - 1);
        const ordered: File[] = [capped[pi]];
        for (let i = 0; i < n; i++) {
          if (i !== pi) ordered.push(capped[i]);
        }
        for (let i = 0; i < ordered.length; i++) {
          await uploadPropertyImage(propertyId, ordered[i], { isPrimary: i === 0 });
        }
      }
      if (Number.isFinite(propertyId) && videoFile) {
        await uploadPropertyVideo(propertyId, videoFile);
      }

      onPropertyAdded?.();
      setShowSaveDialog(false);
      onClose();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save property.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" aria-hidden onClick={onClose} />
      <div
        className="relative z-10 w-full max-w-2xl rounded-2xl border border-[#e2e8f0] bg-white shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-property-title"
      >
        <div className="flex items-center justify-between border-b border-[#e2e8f0] px-6 py-4">
          <h2 id="add-property-title" className="text-xl font-semibold text-[#1e293b]">
            Add New Property
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex size-9 items-center justify-center rounded-lg text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#1e293b]"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 border-b border-[#e2e8f0] px-6 py-3">
          {STEPS.map((s, i) => (
            <React.Fragment key={s.id}>
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-medium",
                    step === s.id ? "bg-[var(--logo)] text-white" : "bg-[#f1f5f9] text-[#64748b]"
                  )}
                >
                  {s.id}
                </div>
                <span
                  className={cn(
                    "text-sm",
                    step === s.id ? "font-medium text-[#1e293b]" : "text-[#64748b]"
                  )}
                >
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && <span className="text-[#cbd5e1]">|</span>}
            </React.Fragment>
          ))}
        </div>

        <div className="max-h-[60vh] overflow-y-auto px-6 py-6">
          {step === 1 && (
            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="property-title" className="text-[#1e293b]">
                  Property Title <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="property-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="border-[#e2e8f0] bg-white text-[#1e293b]"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="property-description" className="text-[#1e293b]">
                  Property Description <span className="text-red-500">*</span>
                </Label>
                <textarea
                  id="property-description"
                  value={description}
                  onChange={handleDescriptionChange}
                  maxLength={200}
                  rows={4}
                  placeholder="Describe the listing"
                  className="w-full rounded-lg border border-[#e2e8f0] bg-white px-3 py-2 text-sm text-[#1e293b] placeholder:text-[#94a3b8] focus:border-[var(--logo)] focus:outline-none focus:ring-2 focus:ring-[var(--logo)]/20"
                  required
                />
                <p className="text-right text-xs text-[#64748b]">{description.length}/200</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="listing-type" className="text-[#1e293b]">
                  Listing Type <span className="text-red-500">*</span>
                </Label>
                <Select value={listingType} onValueChange={(v) => setListingType(v as "rent" | "sale")}>
                  <SelectTrigger id="listing-type" className="border-[#e2e8f0] bg-white text-[#1e293b]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LISTING_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t === "rent" ? "For Rent" : "For Sale"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="property-type" className="text-[#1e293b]">
                  Property Type <span className="text-red-500">*</span>
                </Label>
                <Select value={propertyType} onValueChange={(v) => setPropertyType(v as Property["property_type"])}>
                  <SelectTrigger id="property-type" className="border-[#e2e8f0] bg-white text-[#1e293b]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROPERTY_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="property-condition" className="text-[#1e293b]">
                  Property Condition <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={propertyCondition}
                  onValueChange={(v) => setPropertyCondition(v as Property["property_condition"])}
                >
                  <SelectTrigger id="property-condition" className="border-[#e2e8f0] bg-white text-[#1e293b]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROPERTY_CONDITIONS.map((condition) => (
                      <SelectItem key={condition} value={condition}>
                        {condition === "newly_built"
                          ? "Newly Built"
                          : condition === "fairly_used"
                            ? "Fairly Used"
                            : "Used"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className={`grid gap-4 ${listingType === "sale" ? "grid-cols-1" : "grid-cols-2"}`}>
                <div className="space-y-2">
                  <Label htmlFor="price" className="text-[#1e293b]">
                    {listingType === "sale" ? "Price" : "Monthly rent"} <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="price"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="3500"
                    className="border-[#e2e8f0] bg-white text-[#1e293b]"
                    required
                  />
                  <p className="text-xs text-[#64748b]">
                    Numbers only (amount in selected currency). Daily rate is derived for the API (÷ 30.44).
                  </p>
                </div>
                {listingType !== "sale" && (
                  <div className="space-y-2">
                    <Label htmlFor="rental-period" className="text-[#1e293b]">
                      Min stay <span className="text-red-500">*</span>
                    </Label>
                    <Select value={rentalPeriod} onValueChange={setRentalPeriod}>
                      <SelectTrigger id="rental-period" className="border-[#e2e8f0] bg-white text-[#1e293b]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="6 months">6 months</SelectItem>
                        <SelectItem value="1 year">1 year</SelectItem>
                        <SelectItem value="2 years">2 years</SelectItem>
                        <SelectItem value="3 years">3 years</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>
          )}
          {step === 2 && (
            <AddPropertyLocationStep
              address={location.address}
              city={location.city}
              country={location.country}
              state={location.state}
              zip_code={location.zip_code}
              availableCountries={countries}
              onLocationChange={setLocation}
            />
          )}
          {step === 3 && (
            <AddPropertyDetailsStep
              bedrooms={bedrooms}
              bathrooms={bathrooms}
              area={area}
              onBedroomsChange={setBedrooms}
              onBathroomsChange={setBathrooms}
              onAreaChange={setArea}
            />
          )}
          {step === 4 && (
            <AddPropertyMediaStep
              files={photoFiles}
              onFilesChange={setPhotoFiles}
              videoFile={videoFile}
              onVideoFileChange={setVideoFile}
              primaryIndex={primaryPhotoIndex}
              onPrimaryIndexChange={setPrimaryPhotoIndex}
            />
          )}
          {step === 5 && <AddPropertyRentalStep value={rentalForm} onChange={setRentalForm} />}
        </div>

        <div className="flex justify-between border-t border-[#e2e8f0] px-6 py-4">
          <div>
            {step > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(step - 1)}
                className="border-[#e2e8f0] bg-white text-[#1e293b] hover:bg-[#f8fafc]"
              >
                Back
              </Button>
            )}
          </div>
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-[#e2e8f0] bg-white text-[#1e293b] hover:bg-[#f8fafc]"
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!canContinue()}
              onClick={() => {
                if (step < STEPS.length) setStep(step + 1);
                else setShowSaveDialog(true);
              }}
              className="bg-[var(--logo)] text-white shadow-sm transition-transform transition-colors duration-150 hover:-translate-y-0.5 hover:bg-[var(--logo-hover)] active:scale-95 disabled:pointer-events-none disabled:opacity-50"
            >
              {step < STEPS.length ? "Continue" : "Save"}
            </Button>
          </div>
        </div>

        {showSaveDialog && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40">
            <div className="rounded-2xl bg-white px-8 py-7 text-center shadow-xl">
              <div className="mx-auto mb-4 flex size-10 items-center justify-center rounded-full bg-[var(--logo-muted)] text-[var(--logo)]">
                <span className="text-lg">!</span>
              </div>
              <h3 className="mb-1 text-lg font-semibold text-[#1e293b]">Create listing?</h3>
              <p className="mb-6 text-sm text-[#64748b]">This will submit the property to your backend as the logged-in host.</p>
              {saveError && (
                <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{saveError}</p>
              )}
              <div className="flex justify-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSaving}
                  onClick={() => setShowSaveDialog(false)}
                  className="border-[#e2e8f0] bg-white text-[#1e293b] hover:bg-[#f8fafc]"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  disabled={isSaving}
                  onClick={handleSave}
                  className="bg-[var(--logo)] text-white shadow-md transition-transform transition-colors duration-150 hover:-translate-y-0.5 hover:bg-[var(--logo-hover)] active:scale-95"
                >
                  {isSaving ? "Saving…" : "Create property"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
