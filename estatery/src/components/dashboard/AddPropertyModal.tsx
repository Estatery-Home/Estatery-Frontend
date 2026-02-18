"use client";

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
};

export function AddPropertyModal({ open, onClose }: AddPropertyModalProps) {
  const [step, setStep] = React.useState(1);
  const [title, setTitle] = React.useState("Modern 3-Bedroom Family Home in Suburban Area");
  const [description, setDescription] = React.useState("");
  const [descLength, setDescLength] = React.useState(50);
  const [propertyType, setPropertyType] = React.useState("House");
  const [status, setStatus] = React.useState("For Sale");
  const [price, setPrice] = React.useState("₵350,000");
  const [listingDate, setListingDate] = React.useState("2025-07-22");
  const [contactName, setContactName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [agent, setAgent] = React.useState("");
  const [showSaveDialog, setShowSaveDialog] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const v = e.target.value;
    setDescription(v);
    setDescLength(Math.min(v.length, 200));
  };

  const handleContactChange = (
    field: "contactName" | "phone" | "email" | "agent",
    value: string
  ) => {
    if (field === "contactName") setContactName(value);
    if (field === "phone") setPhone(value);
    if (field === "email") setEmail(value);
    if (field === "agent") setAgent(value);
  };

  const handleSave = () => {
    setIsSaving(true);

    const payload = {
      title,
      description,
      propertyType,
      status,
      price,
      listingDate,
      contactName,
      phone,
      email,
      agent,
    };

    // Simulate async save
    setTimeout(() => {
      console.log("Saved property:", payload);
      setIsSaving(false);
      setShowSaveDialog(false);
      onClose();
      setStep(1);
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
                <Select value={propertyType} onValueChange={setPropertyType}>
                  <SelectTrigger id="property-type" className="border-[#e2e8f0] bg-white text-[#1e293b]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="House">House</SelectItem>
                    <SelectItem value="Apartment">Apartment</SelectItem>
                    <SelectItem value="Condo">Condo</SelectItem>
                    <SelectItem value="Land">Land</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status" className="text-[#1e293b]">
                  Status
                </Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger id="status" className="border-[#e2e8f0] bg-white text-[#1e293b]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="For Sale">For Sale</SelectItem>
                    <SelectItem value="For Rent">For Rent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price" className="text-[#1e293b]">
                    Price
                  </Label>
                  <Input
                    id="price"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="₵350,000"
                    className="border-[#e2e8f0] bg-white text-[#1e293b]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="listing-date" className="text-[#1e293b]">
                    Listing Date
                  </Label>
                  <Input
                    id="listing-date"
                    type="date"
                    value={listingDate}
                    onChange={(e) => setListingDate(e.target.value)}
                    className="border-[#e2e8f0] bg-white text-[#1e293b]"
                  />
                </div>
              </div>
            </div>
          )}
          {/* Step 2: Location Details */}
          {step === 2 && <AddPropertyLocationStep />}
          {step === 3 && <AddPropertyDetailsStep />}
          {step === 4 && <AddPropertyMediaStep />}
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
