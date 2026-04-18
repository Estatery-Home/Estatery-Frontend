"use client";

/**
 * Add Property step 4 – multiple photos and pick featured (primary) for listings.
 */
import * as React from "react";
import { Star } from "lucide-react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type AddPropertyMediaStepProps = {
  files: File[];
  onFilesChange: (files: File[]) => void;
  /** Index in `files` of the image used as cover / primary after upload */
  primaryIndex: number;
  onPrimaryIndexChange: (index: number) => void;
};

export function AddPropertyMediaStep({
  files,
  onFilesChange,
  primaryIndex,
  onPrimaryIndexChange,
}: AddPropertyMediaStepProps) {
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [thumbUrls, setThumbUrls] = React.useState<string[]>([]);

  React.useEffect(() => {
    const urls = files.map((f) => (f.type.startsWith("image/") ? URL.createObjectURL(f) : ""));
    setThumbUrls(urls);
    return () => {
      for (const u of urls) {
        if (u) URL.revokeObjectURL(u);
      }
    };
  }, [files]);

  React.useEffect(() => {
    if (files.length === 0 && primaryIndex !== 0) {
      onPrimaryIndexChange(0);
      return;
    }
    if (files.length > 0 && primaryIndex >= files.length) {
      onPrimaryIndexChange(0);
    }
  }, [files.length, primaryIndex, onPrimaryIndexChange]);

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
    event.target.value = "";
  };

  const safePrimary = files.length === 0 ? 0 : Math.min(primaryIndex, files.length - 1);

  return (
    <div className="space-y-5">
      <h3 className="text-lg font-semibold text-[#1e293b]">Photos</h3>
      <p className="text-sm text-[#64748b]">
        Add multiple images. Choose one as the featured image — it is highlighted and used as the default cover
        for listings and search cards.
      </p>

      <div className="space-y-2">
        <Label className="text-[#1e293b]">Listing photos</Label>
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#cbd5e1] bg-[#f8fafc] px-4 py-6 text-center text-sm text-[#64748b]">
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

      {files.length > 0 && (
        <div className="space-y-2">
          <Label className="text-[#1e293b]">Featured image</Label>
          <p className="text-xs text-[#64748b]">Click a thumbnail to set it as the main listing photo.</p>
          <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {files.map((file, i) => {
              const thumb = thumbUrls[i] || null;
              const isPrimary = i === safePrimary;
              return (
                <li key={`${file.name}-${i}`}>
                  <button
                    type="button"
                    onClick={() => onPrimaryIndexChange(i)}
                    className={cn(
                      "relative aspect-square w-full overflow-hidden rounded-lg border-2 bg-slate-100 text-left shadow-sm transition",
                      isPrimary
                        ? "border-[var(--logo)] ring-2 ring-[var(--logo)]/30"
                        : "border-transparent hover:border-[#cbd5e1]"
                    )}
                  >
                    {thumb ? (
                      <img src={thumb} alt="" className="size-full object-cover" />
                    ) : (
                      <span className="flex size-full items-center justify-center text-[10px] text-[#94a3b8]">
                        {file.name}
                      </span>
                    )}
                    {isPrimary && (
                      <span className="absolute left-1 top-1 inline-flex items-center gap-0.5 rounded bg-[var(--logo)] px-1.5 py-0.5 text-[10px] font-semibold text-white shadow">
                        <Star className="size-3 fill-white text-white" />
                        Main
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
