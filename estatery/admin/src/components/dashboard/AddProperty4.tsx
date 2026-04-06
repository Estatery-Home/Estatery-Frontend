"use client";

/**
 * Add Property step 4 – photos are uploaded via Django/admin after the listing exists (no multipart API here).
 */
import * as React from "react";
import { Label } from "@/components/ui/label";

type AddPropertyMediaStepProps = {
  imageUrl?: string;
  onImageChange?: (url: string) => void;
};

export function AddPropertyMediaStep({ imageUrl, onImageChange }: AddPropertyMediaStepProps) {
  const [filesSummary, setFilesSummary] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleFilesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      setFilesSummary(null);
      return;
    }

    if (files.length === 1) {
      setFilesSummary(files[0].name);
      const file = files[0];
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result;
          if (typeof result === "string") onImageChange?.(result);
        };
        reader.readAsDataURL(file);
      }
    } else {
      setFilesSummary(`${files.length} files selected (only first image previewed locally)`);
      const firstImage = Array.from(files).find((f) => f.type.startsWith("image/"));
      if (firstImage) {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result;
          if (typeof result === "string") onImageChange?.(result);
        };
        reader.readAsDataURL(firstImage);
      }
    }
  };

  return (
    <div className="space-y-5">
      <h3 className="text-lg font-semibold text-[#1e293b]">Photos</h3>
      <p className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-sm text-amber-900">
        Property images are saved on the server through the listing record (e.g. Django admin or a future
        upload endpoint). Creating the listing does not attach files yet—add photos after save.
      </p>

      <div className="space-y-2">
        <Label className="text-[#1e293b]">Optional: preview a cover image (local only)</Label>
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#cbd5e1] bg-[#f8fafc] px-4 py-8 text-center text-sm text-[#64748b]">
          <p className="mb-2">Browse for a preview (not sent to the API in this step)</p>
          <button
            type="button"
            onClick={handleBrowseClick}
            className="rounded-full bg-[var(--logo)] px-4 py-2 text-xs font-medium text-white shadow-sm transition-transform transition-colors duration-150 hover:-translate-y-0.5 hover:bg-[var(--logo-hover)] active:scale-95"
          >
            Browse
          </button>
          {filesSummary && (
            <p className="mt-3 text-xs text-[#94a3b8]">{filesSummary}</p>
          )}
          {imageUrl?.startsWith("data:") && (
            <img
              src={imageUrl}
              alt=""
              className="mt-4 max-h-32 rounded-lg object-cover"
            />
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFilesChange}
        />
      </div>
    </div>
  );
}
