"use client";

/**
 * Add Property step 4 – select photos; files are uploaded to the API after the listing is created.
 */
import * as React from "react";
import { Label } from "@/components/ui/label";

type AddPropertyMediaStepProps = {
  files: File[];
  onFilesChange: (files: File[]) => void;
};

export function AddPropertyMediaStep({ files, onFilesChange }: AddPropertyMediaStepProps) {
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    if (files.length === 0) {
      setPreviewUrl(null);
      return;
    }
    const first = files.find((f) => f.type.startsWith("image/"));
    if (!first) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(first);
    setPreviewUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [files]);

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleFilesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const list = event.target.files;
    if (!list || list.length === 0) {
      onFilesChange([]);
      return;
    }
    onFilesChange(Array.from(list));
  };

  return (
    <div className="space-y-5">
      <h3 className="text-lg font-semibold text-[#1e293b]">Photos</h3>
      <p className="text-sm text-[#64748b]">
        Choose one or more images. They are uploaded to the server right after you create the listing (first
        image becomes the cover).
      </p>

      <div className="space-y-2">
        <Label className="text-[#1e293b]">Listing photos</Label>
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#cbd5e1] bg-[#f8fafc] px-4 py-8 text-center text-sm text-[#64748b]">
          <p className="mb-2">
            {files.length > 0 ? `${files.length} file(s) selected` : "Browse to add photos (optional)"}
          </p>
          <button
            type="button"
            onClick={handleBrowseClick}
            className="rounded-full bg-[var(--logo)] px-4 py-2 text-xs font-medium text-white shadow-sm transition-transform transition-colors duration-150 hover:-translate-y-0.5 hover:bg-[var(--logo-hover)] active:scale-95"
          >
            Browse
          </button>
          {previewUrl ? (
            <img src={previewUrl} alt="" className="mt-4 max-h-40 rounded-lg object-cover shadow-sm" />
          ) : null}
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
