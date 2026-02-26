"use client";

/**
 * Multi-step Add Property modal (5 steps).
 * Collects: basic info, location, details, media, contact.
 * Calls onPropertyAdded when complete; ID is assigned by PropertiesContext.
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
import { PROPERTY_TYPES } from "@/lib/properties";
import { AddPropertyLocationStep } from "./AddProperty2";
import { AddPropertyDetailsStep } from "./AddProperty3";
import { AddPropertyMediaStep } from "./AddProperty4";
import { AddPropertyContactStep } from "./AddProperty5";


const STEPS = [
  { id: 1, label: "Basic Information" },
  { id: 2, label: "Location Details" },
  { id: 3, label: "Property Details" },
  { id: 4, label: "Photos & Media" },
  { id: 5, label: "Contact Information" },
] as const;

type AddPropertyModalProps = {
  open: boolean;
  onClose: () => void;
  onPropertyAdded?: (property: Omit<Property, "id">) => void;
};

export function AddPropertyModal({ open, onClose, onPropertyAdded }: AddPropertyModalProps) {
  const [step, setStep] = React.useState(1);
  const [title, setTitle] = React.useState("Modern 3-Bedroom Family Home in Suburban Area");
  const [description, setDescription] = React.useState("");
  const [descLength, setDescLength] = React.useState(50);
  const [propertyType, setPropertyType] = React.useState<Property["property_type"]>("house");
  const [price, setPrice] = React.useState("₵350,000");
  const [rentalPeriod, setRentalPeriod] = React.useState("1 year");
  const [contactName, setContactName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [agent, setAgent] = React.useState("");
  const [showSaveDialog, setShowSaveDialog] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [address, setAddress] = React.useState("");
  const [city, setCity] = React.useState("");
  const [country, setCountry] = React.useState("USA");
  const [bedrooms, setBedrooms] = React.useState<number>(3);
  const [bathrooms, setBathrooms] = React.useState<number>(2);
  const [area, setArea] = React.useState<number>(2000);
  const [imageUrl, setImageUrl] = React.useState<string>("/images/property-1.webp");

  /* Track description length for step 1 (max 200 chars) */
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const v = e.target.value;
    setDescription(v);
    setDescLength(Math.min(v.length, 200));
  };

  /* Update contact field (name, phone, email, agent) in step 5 */
  const handleContactChange = (
    field: "contactName" | "phone" | "email" | "agent",
    value: string
  ) => {
    if (field === "contactName") setContactName(value);
    if (field === "phone") setPhone(value);
    if (field === "email") setEmail(value);
    if (field === "agent") setAgent(value);
  };

  /* Build API-aligned property object, call onPropertyAdded, reset modal */
  const handleSave = () => {
    setIsSaving(true);
    const priceVal = price.replace(/\/month$/, "").trim().replace(/[^0-9.]/g, "") || "0";
    const monthlyPrice = priceVal;
    const dailyPrice = (parseFloat(priceVal) / 30).toFixed(2);
    const now = new Date().toISOString();
    const newProperty: Omit<Property, "id"> = {
      title,
      address: address || "Address to be added",
      city: city || "TBD",
      country: country || "USA",
      description: description || "",
      daily_price: dailyPrice,
      monthly_price: monthlyPrice,
      currency: "ghs",
      bedrooms: bedrooms ?? 0,
      bathrooms: bathrooms ?? 0,
      area: area ?? 0,
      property_type: propertyType,
      status: "available",
      primary_image: { image: imageUrl },
      min_stay_months: rentalPeriod === "6 months" ? 6 : rentalPeriod === "2 years" ? 24 : 12,
      created_at: now,
      updated_at: now,
    };

    setTimeout(() => {
      onPropertyAdded?.(newProperty);
      setIsSaving(false);
      setShowSaveDialog(false);
      onClose();
      setStep(1);
      setAddress("");
      setCity("");
      setCountry("USA");
      setBedrooms(3);
      setBathrooms(2);
      setArea(2000);
      setImageUrl("/images/property-1.webp");
    }, 700);
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
        {/* Header */}
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

        {/* Step indicator */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 border-b border-[#e2e8f0] px-6 py-3">
          {STEPS.map((s, i) => (
            <React.Fragment key={s.id}>
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-medium",
                    step === s.id
                      ? "bg-[var(--logo)] text-white"
                      : "bg-[#f1f5f9] text-[#64748b]"
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

        {/* Step content */}
        <div className="max-h-[60vh] overflow-y-auto px-6 py-6">
          {step === 1 && (
            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="property-title" className="text-[#1e293b]">
                  Property Title
                </Label>
                <Input
                  id="property-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="border-[#e2e8f0] bg-white text-[#1e293b]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="property-description" className="text-[#1e293b]">
                  Property Description
                </Label>
                <textarea
                  id="property-description"
                  value={description}
                  onChange={handleDescriptionChange}
                  maxLength={200}
                  rows={4}
                  placeholder="Enter property description..."
                  className="w-full rounded-lg border border-[#e2e8f0] bg-white px-3 py-2 text-sm text-[#1e293b] placeholder:text-[#94a3b8] focus:border-[var(--logo)] focus:outline-none focus:ring-2 focus:ring-[var(--logo)]/20"
                />
                <p className="text-right text-xs text-[#64748b]">{descLength}/200</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="property-type" className="text-[#1e293b]">
                  Property Type
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price" className="text-[#1e293b]">
                    Monthly Price (₵)
                  </Label>
                  <Input
                    id="price"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="₵2,500"
                    className="border-[#e2e8f0] bg-white text-[#1e293b]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rental-period" className="text-[#1e293b]">
                    Min Stay
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
              </div>
            </div>
          )}
          {/* Step 2: Location Details (API: address, city, country) */}
          {step === 2 && (
            <AddPropertyLocationStep
              address={address}
              city={city}
              country={country}
              onLocationChange={(data) => {
                setAddress(data.address);
                setCity(data.city);
                setCountry(data.country);
              }}
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
              imageUrl={imageUrl}
              onImageChange={setImageUrl}
            />
          )}
          {step === 5 && (
            <AddPropertyContactStep
              contactName={contactName}
              phone={phone}
              email={email}
              agent={agent}
              onChange={handleContactChange}
            />
          )}
        </div>

        {/* Footer */}
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
              onClick={() => {
                if (step < STEPS.length) {
                  setStep(step + 1);
                } else {
                  setShowSaveDialog(true);
                }
              }}
              className="bg-[var(--logo)] text-white shadow-sm transition-transform transition-colors duration-150 hover:-translate-y-0.5 hover:bg-[var(--logo-hover)] active:scale-95"
            >
              {step < STEPS.length ? "Continue" : "Save"}
            </Button>
          </div>
        </div>

        {showSaveDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="rounded-2xl bg-white px-8 py-7 text-center shadow-xl">
              <div className="mx-auto mb-4 flex size-10 items-center justify-center rounded-full bg-[var(--logo-muted)] text-[var(--logo)]">
                <span className="text-lg">!</span>
              </div>
              <h3 className="mb-1 text-lg font-semibold text-[#1e293b]">Save Your Changes?</h3>
              <p className="mb-6 text-sm text-[#64748b]">
                You&apos;ve made some changes. Make sure to save them before you leave.
              </p>
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
                  {isSaving ? "Saving..." : "Yes, Save"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
