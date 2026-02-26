"use client";

/**
 * Add Property step 4 – Media upload; reads file as data URL.
 * Calls onImageChange with base64 when image selected.
 */
import * as React from "react";
import { Label } from "@/components/ui/label";

type AddPropertyMediaStepProps = {
  imageUrl?: string;
  onImageChange?: (url: string) => void;
};

export function AddPropertyMediaStep({
  imageUrl,
  onImageChange,
}: AddPropertyMediaStepProps = {}) {
  const [mediaType, setMediaType] = React.useState("Placeholder");
  const [filesSummary, setFilesSummary] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  /* Read first image file as data URL, pass to parent */
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
      setFilesSummary(`${files.length} files selected`);
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
      <h3 className="text-lg font-semibold text-[#1e293b]">Images &amp; Media</h3>

      <div className="space-y-2">
        <Label htmlFor="upload-media" className="text-[#1e293b]">
          Upload Media
        </Label>
        <button
          id="upload-media"
          type="button"
          onClick={handleBrowseClick}
          className="flex w-full items-center justify-between rounded-lg border border-[#e2e8f0] bg-white px-3 py-2 text-left text-sm text-[#1e293b] shadow-sm transition-colors hover:border-[var(--logo)] hover:bg-[var(--logo-muted)]/40"
        >
          <span>{mediaType}</span>
          <span className="text-xs text-[#64748b]">Change</span>
        </button>
      </div>

      <div className="space-y-2">
        <Label className="text-[#1e293b]">Upload Property Photos</Label>
        <div
          className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#cbd5e1] bg-[#f8fafc] px-4 py-10 text-center text-sm text-[#64748b]"
        >
          <p className="mb-2">Drag &amp; Drop your files or</p>
          <button
            type="button"
            onClick={handleBrowseClick}
            className="rounded-full bg-[var(--logo)] px-4 py-2 text-xs font-medium text-white shadow-sm transition-transform transition-colors duration-150 hover:-translate-y-0.5 hover:bg-[var(--logo-hover)] active:scale-95"
          >
            Browse
          </button>
          {filesSummary && (
            <p className="mt-3 text-xs text-[#94a3b8]">
              {filesSummary}
            </p>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFilesChange}
        />
      </div>
    </div>
  );
}

