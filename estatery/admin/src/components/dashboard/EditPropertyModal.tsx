"use client";

/**
 * Edit listing — PATCH /api/properties/:id/ with PropertySerializer fields.
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
import type { Property } from "@/lib/properties";
import {
  PROPERTY_TYPES,
  LISTING_TYPES,
  PROPERTY_STATUSES,
  getPropertyStatusBadgeClass,
  getPropertyStatusDisplay,
} from "@/lib/properties";
import type { PropertyStatusApi } from "@/lib/api-types";
import { deletePropertyVideo, fetchPropertyFromApi, updateProperty, uploadPropertyVideo } from "@/lib/api-client";
import { bumpPropertyCatalogCache } from "@/lib/catalog-bump";
import { cn } from "@/lib/utils";
import { useProperties } from "@/contexts/PropertiesContext";
import { propertyFromApiJson } from "@/lib/properties";

type EditPropertyModalProps = {
  property: Property | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
};

export function toPropertyNumericId(id: Property["id"]): number | null {
  const n = typeof id === "number" ? id : parseInt(String(id), 10);
  return Number.isNaN(n) ? null : n;
}

export function EditPropertyModal({ property, open, onClose, onSaved }: EditPropertyModalProps) {
  const { applyPropertyFromApi } = useProperties();
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [listingType, setListingType] = React.useState<"rent" | "sale">("rent");
  const [propertyType, setPropertyType] = React.useState<Property["property_type"]>("house");
  const [status, setStatus] = React.useState<PropertyStatusApi>("available");
  const [price, setPrice] = React.useState("");
  const [currency, setCurrency] = React.useState("ghs");
  const [address, setAddress] = React.useState("");
  const [city, setCity] = React.useState("");
  const [state, setState] = React.useState("");
  const [country, setCountry] = React.useState("");
  const [zipCode, setZipCode] = React.useState("");
  const [bedrooms, setBedrooms] = React.useState(1);
  const [bathrooms, setBathrooms] = React.useState(1);
  const [area, setArea] = React.useState(0);
  const [minStayMonths, setMinStayMonths] = React.useState(12);
  const [maxStayMonths, setMaxStayMonths] = React.useState("");
  const [monthlyCycleStart, setMonthlyCycleStart] = React.useState(1);
  const [securityDepositMonths, setSecurityDepositMonths] = React.useState(2);
  const [hasWifi, setHasWifi] = React.useState(false);
  const [hasParking, setHasParking] = React.useState(false);
  const [hasPool, setHasPool] = React.useState(false);
  const [hasGym, setHasGym] = React.useState(false);
  const [isFurnished, setIsFurnished] = React.useState(false);
  const [hasKitchen, setHasKitchen] = React.useState(true);
  const [currentVideoId, setCurrentVideoId] = React.useState<number | null>(null);
  const [currentVideoUrl, setCurrentVideoUrl] = React.useState<string | null>(null);
  const [removeCurrentVideo, setRemoveCurrentVideo] = React.useState(false);
  const [replacementVideoFile, setReplacementVideoFile] = React.useState<File | null>(null);
  const [replacementVideoPreviewUrl, setReplacementVideoPreviewUrl] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open || !property) return;
    setTitle(property.title);
    setDescription(property.description);
    setListingType(property.listing_type ?? "rent");
    setPropertyType(property.property_type);
    setStatus(property.status);
    setPrice(String(property.monthly_price ?? "").replace(/[^\d.]/g, "") || property.monthly_price);
    setCurrency(property.currency || "ghs");
    setAddress(property.address);
    setCity(property.city);
    setState(property.state ?? "");
    setCountry(property.country);
    setZipCode(property.zip_code ?? "");
    setBedrooms(property.bedrooms);
    setBathrooms(property.bathrooms);
    setArea(property.area);
    setMinStayMonths(property.min_stay_months ?? 12);
    setMaxStayMonths(
      property.max_stay_months != null && property.max_stay_months > 0
        ? String(property.max_stay_months)
        : ""
    );
    setMonthlyCycleStart(property.monthly_cycle_start ?? 1);
    setSecurityDepositMonths(
      property.security_deposit_months != null
        ? parseFloat(String(property.security_deposit_months))
        : 2
    );
    setHasWifi(Boolean(property.has_wifi));
    setHasParking(Boolean(property.has_parking));
    setHasPool(Boolean(property.has_pool));
    setHasGym(Boolean(property.has_gym));
    setIsFurnished(Boolean(property.is_furnished));
    setHasKitchen(property.has_kitchen !== false);
    const existingVideo = property.primary_video ?? property.videos?.[0] ?? null;
    setCurrentVideoId(existingVideo?.id ?? null);
    setCurrentVideoUrl(existingVideo?.video ?? null);
    setRemoveCurrentVideo(false);
    setReplacementVideoFile(null);
    setError(null);
  }, [open, property]);

  React.useEffect(() => {
    if (!replacementVideoFile || !replacementVideoFile.type.startsWith("video/")) {
      setReplacementVideoPreviewUrl(null);
      return;
    }
    const preview = URL.createObjectURL(replacementVideoFile);
    setReplacementVideoPreviewUrl(preview);
    return () => URL.revokeObjectURL(preview);
  }, [replacementVideoFile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!property) return;
    const numId = toPropertyNumericId(property.id);
    if (numId == null) {
      setError("Invalid property id.");
      return;
    }
    setSaving(true);
    setError(null);
    const priceVal = price.replace(/[^\d.]/g, "") || "0";
    const monthlyNum = parseFloat(priceVal);
    const dailyPrice = (monthlyNum / 30.44).toFixed(2);

    let maxStay: number | null | undefined;
    if (maxStayMonths.trim()) {
      const m = parseInt(maxStayMonths, 10);
      if (!Number.isNaN(m) && m > 0) maxStay = m;
    } else {
      maxStay = null;
    }

    const payload: Record<string, unknown> = {
      title: title.trim(),
      description: description.trim(),
      listing_type: listingType,
      property_type: propertyType,
      status,
      address: address.trim(),
      city: city.trim(),
      country: country.trim(),
      state: state.trim() || "Optional",
      zip_code: zipCode.trim() || null,
      daily_price: dailyPrice,
      monthly_price: priceVal,
      currency,
      bedrooms,
      bathrooms,
      area,
      min_stay_months: minStayMonths,
      monthly_cycle_start: monthlyCycleStart,
      security_deposit_months: securityDepositMonths,
      has_wifi: hasWifi,
      has_parking: hasParking,
      has_pool: hasPool,
      has_gym: hasGym,
      is_furnished: isFurnished,
      has_kitchen: hasKitchen,
      max_stay_months: maxStay,
    };

    try {
      const res = await updateProperty(numId, payload);
      if ((removeCurrentVideo || replacementVideoFile) && currentVideoId != null) {
        await deletePropertyVideo(numId, currentVideoId);
      }
      if (replacementVideoFile) {
        await uploadPropertyVideo(numId, replacementVideoFile);
      }
      const fresh = await fetchPropertyFromApi(numId);
      if (fresh) {
        applyPropertyFromApi(fresh as Record<string, unknown>);
      } else {
        applyPropertyFromApi(res.property);
      }
      const merged = propertyFromApiJson(fresh ?? res.property);
      if (merged) {
        setCurrentVideoId(merged.primary_video?.id ?? merged.videos?.[0]?.id ?? null);
        setCurrentVideoUrl(merged.primary_video?.video ?? merged.videos?.[0]?.video ?? null);
      }
      bumpPropertyCatalogCache();
      await Promise.resolve(onSaved());
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed.");
    } finally {
      setSaving(false);
    }
  };

  if (!open || !property) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" aria-hidden onClick={onClose} />
      <div
        className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col rounded-2xl border border-[#e2e8f0] bg-white shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-property-title"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-[#e2e8f0] px-5 py-4">
          <h2 id="edit-property-title" className="text-lg font-semibold text-[#1e293b]">
            Edit property
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex size-9 items-center justify-center rounded-lg text-[#64748b] hover:bg-[#f1f5f9]"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="max-h-[calc(90vh-8rem)] overflow-y-auto px-5 py-4">
            {error ? (
              <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
            ) : null}

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="border-[#e2e8f0]"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-desc">Description</Label>
                <textarea
                  id="edit-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  required
                  className="w-full rounded-lg border border-[#e2e8f0] px-3 py-2 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Listing</Label>
                  <Select value={listingType} onValueChange={(v) => setListingType(v as "rent" | "sale")}>
                    <SelectTrigger className="border-[#e2e8f0]">
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
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Label>Status</Label>
                    <span
                      className={cn(
                        "rounded-md px-2 py-0.5 text-[10px] font-semibold",
                        getPropertyStatusBadgeClass(status)
                      )}
                    >
                      {getPropertyStatusDisplay(status)}
                    </span>
                  </div>
                  <Select value={status} onValueChange={(v) => setStatus(v as PropertyStatusApi)}>
                    <SelectTrigger className="border-[#e2e8f0]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PROPERTY_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {getPropertyStatusDisplay(s)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Property type</Label>
                <Select
                  value={propertyType}
                  onValueChange={(v) => setPropertyType(v as Property["property_type"])}
                >
                  <SelectTrigger className="border-[#e2e8f0]">
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

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="edit-price">
                    {listingType === "sale" ? "Price" : "Monthly amount"}
                  </Label>
                  <Input
                    id="edit-price"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                    className="border-[#e2e8f0]"
                  />
                  <p className="text-[10px] text-[#64748b]">Daily rate sent as price ÷ 30.44</p>
                </div>
                <div className="space-y-1.5">
                  <Label>Currency</Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger className="border-[#e2e8f0]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ghs">GHS</SelectItem>
                      <SelectItem value="usd">USD</SelectItem>
                      <SelectItem value="cfa">CFA</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-address">Address</Label>
                <Input
                  id="edit-address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                  className="border-[#e2e8f0]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="edit-city">City</Label>
                  <Input
                    id="edit-city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    required
                    className="border-[#e2e8f0]"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-country">Country</Label>
                  <Input
                    id="edit-country"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    required
                    className="border-[#e2e8f0]"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-state">State / region</Label>
                  <Input
                    id="edit-state"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="border-[#e2e8f0]"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-zip">ZIP</Label>
                  <Input
                    id="edit-zip"
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                    className="border-[#e2e8f0]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="edit-beds">Bedrooms</Label>
                  <Input
                    id="edit-beds"
                    type="number"
                    min={1}
                    value={bedrooms}
                    onChange={(e) => setBedrooms(parseInt(e.target.value, 10) || 1)}
                    className="border-[#e2e8f0]"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-baths">Bathrooms</Label>
                  <Input
                    id="edit-baths"
                    type="number"
                    min={1}
                    value={bathrooms}
                    onChange={(e) => setBathrooms(parseInt(e.target.value, 10) || 1)}
                    className="border-[#e2e8f0]"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-area">Area (sq ft)</Label>
                  <Input
                    id="edit-area"
                    type="number"
                    min={1}
                    value={area}
                    onChange={(e) => setArea(parseInt(e.target.value, 10) || 0)}
                    className="border-[#e2e8f0]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="edit-min">Min stay (months)</Label>
                  <Input
                    id="edit-min"
                    type="number"
                    min={1}
                    value={minStayMonths}
                    onChange={(e) => setMinStayMonths(parseInt(e.target.value, 10) || 1)}
                    className="border-[#e2e8f0]"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-max">Max stay (optional)</Label>
                  <Input
                    id="edit-max"
                    type="number"
                    min={1}
                    placeholder="—"
                    value={maxStayMonths}
                    onChange={(e) => setMaxStayMonths(e.target.value)}
                    className="border-[#e2e8f0]"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-cycle">Cycle start (1–28)</Label>
                  <Input
                    id="edit-cycle"
                    type="number"
                    min={1}
                    max={28}
                    value={monthlyCycleStart}
                    onChange={(e) =>
                      setMonthlyCycleStart(Math.min(28, Math.max(1, parseInt(e.target.value, 10) || 1)))
                    }
                    className="border-[#e2e8f0]"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-deposit">Deposit (months)</Label>
                  <Input
                    id="edit-deposit"
                    type="number"
                    min={0}
                    step={0.5}
                    value={securityDepositMonths}
                    onChange={(e) =>
                      setSecurityDepositMonths(parseFloat(e.target.value) || 0)
                    }
                    className="border-[#e2e8f0]"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-3 text-sm">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={hasWifi} onChange={(e) => setHasWifi(e.target.checked)} />
                  WiFi
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={hasParking}
                    onChange={(e) => setHasParking(e.target.checked)}
                  />
                  Parking
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={hasPool} onChange={(e) => setHasPool(e.target.checked)} />
                  Pool
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={hasGym} onChange={(e) => setHasGym(e.target.checked)} />
                  Gym
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isFurnished}
                    onChange={(e) => setIsFurnished(e.target.checked)}
                  />
                  Furnished
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={hasKitchen}
                    onChange={(e) => setHasKitchen(e.target.checked)}
                  />
                  Kitchen
                </label>
              </div>

              <div className="space-y-2 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] p-3">
                <Label>Property video</Label>
                {currentVideoUrl && !removeCurrentVideo ? (
                  <div className="space-y-2">
                    <video controls className="max-h-56 w-full rounded border border-[#e2e8f0] bg-black">
                      <source src={currentVideoUrl} />
                    </video>
                    <button
                      type="button"
                      className="text-xs font-medium text-red-700 hover:underline"
                      onClick={() => setRemoveCurrentVideo(true)}
                    >
                      Remove current video
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-[#64748b]">
                    {currentVideoUrl && removeCurrentVideo ? "Current video will be removed on save." : "No video uploaded yet."}
                  </p>
                )}
                <div className="space-y-2">
                  <Input
                    type="file"
                    accept="video/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file || !file.type.startsWith("video/")) return;
                      setReplacementVideoFile(file);
                      setRemoveCurrentVideo(false);
                    }}
                    className="border-[#e2e8f0]"
                  />
                  {replacementVideoPreviewUrl ? (
                    <video controls className="max-h-56 w-full rounded border border-[#e2e8f0] bg-black">
                      <source src={replacementVideoPreviewUrl} type={replacementVideoFile?.type || "video/mp4"} />
                    </video>
                  ) : null}
                  {replacementVideoFile ? (
                    <button
                      type="button"
                      className="text-xs font-medium text-[#475569] hover:underline"
                      onClick={() => setReplacementVideoFile(null)}
                    >
                      Clear selected replacement video
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 justify-end gap-2 border-t border-[#e2e8f0] px-5 py-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="bg-[var(--logo)] text-white hover:bg-[var(--logo-hover)]">
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
