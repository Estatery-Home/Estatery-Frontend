"use client";

/**
 * Add Property step 4 – multiple photos and pick featured (primary) for listings.
 */
import * as React from "react";
import { Star, X } from "lucide-react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export const MAX_PROPERTY_IMAGES = 5;

type AddPropertyMediaStepProps = {
  files: File[];
  onFilesChange: (files: File[]) => void;
  videoFile: File | null;
  onVideoFileChange: (file: File | null) => void;
  /** Index in `files` of the image used as cover / primary after upload */
  primaryIndex: number;
  onPrimaryIndexChange: (index: number) => void;
};

export function AddPropertyMediaStep({
  files,
  onFilesChange,
  videoFile,
  onVideoFileChange,
  primaryIndex,
  onPrimaryIndexChange,
}: AddPropertyMediaStepProps) {
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const videoInputRef = React.useRef<HTMLInputElement | null>(null);
  const [thumbUrls, setThumbUrls] = React.useState<string[]>([]);
  const [videoPreviewUrl, setVideoPreviewUrl] = React.useState<string | null>(null);

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
    if (!videoFile || !videoFile.type.startsWith("video/")) {
      setVideoPreviewUrl(null);
      return;
    }
    const preview = URL.createObjectURL(videoFile);
    setVideoPreviewUrl(preview);
    return () => URL.revokeObjectURL(preview);
  }, [videoFile]);

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
  const handleVideoBrowseClick = () => {
    videoInputRef.current?.click();
  };

  const handleFilesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const list = event.target.files;
    if (!list || list.length === 0) {
      return;
    }
    const incoming = Array.from(list).filter((f) => f.type.startsWith("image/"));
    const merged = [...files, ...incoming].slice(0, MAX_PROPERTY_IMAGES);
    onFilesChange(merged);
    event.target.value = "";
  };

  const handleVideoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith("video/")) {
      event.target.value = "";
      return;
    }
    onVideoFileChange(file);
    event.target.value = "";
  };

  const safePrimary = files.length === 0 ? 0 : Math.min(primaryIndex, files.length - 1);

  const handleRemoveAt = (index: number) => {
    const next = files.filter((_, i) => i !== index);
    onFilesChange(next);
    if (next.length === 0) {
      onPrimaryIndexChange(0);
      return;
    }
    if (index === primaryIndex) {
      onPrimaryIndexChange(0);
      return;
    }
    if (index < primaryIndex) {
      onPrimaryIndexChange(primaryIndex - 1);
    }
  };

  return (
    <div className="space-y-5">
      <h3 className="text-lg font-semibold text-[#1e293b]">Photos</h3>
      <p className="text-sm text-[#64748b]">
        Add up to {MAX_PROPERTY_IMAGES} images at once (or in batches — we keep the first {MAX_PROPERTY_IMAGES}). Choose one as the
        featured image — it is highlighted and used as the default cover for listings and search cards.
      </p>

      <div className="space-y-2">
        <Label className="text-[#1e293b]">Listing photos</Label>
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#cbd5e1] bg-[#f8fafc] px-4 py-6 text-center text-sm text-[#64748b]">
          <p className="mb-2">
            {files.length > 0
              ? `${files.length} of ${MAX_PROPERTY_IMAGES} image(s) selected`
              : `Browse to add photos (optional, max ${MAX_PROPERTY_IMAGES})`}
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
                  <div
                    className={cn(
                      "relative aspect-square w-full overflow-hidden rounded-lg border-2 bg-slate-100 shadow-sm transition",
                      isPrimary
                        ? "border-[var(--logo)] ring-2 ring-[var(--logo)]/30"
                        : "border-transparent hover:border-[#cbd5e1]"
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => onPrimaryIndexChange(i)}
                      className="size-full text-left"
                      aria-label={`Set ${file.name} as featured image`}
                    >
                      {thumb ? (
                        <img src={thumb} alt="" className="size-full object-cover" />
                      ) : (
                        <span className="flex size-full items-center justify-center text-[10px] text-[#94a3b8]">
                          {file.name}
                        </span>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveAt(i)}
                      className="absolute right-1 top-1 inline-flex size-6 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/75"
                      aria-label={`Remove ${file.name}`}
                    >
                      <X className="size-3.5" />
                    </button>
                    {isPrimary && (
                      <span className="absolute left-1 top-1 inline-flex items-center gap-0.5 rounded bg-[var(--logo)] px-1.5 py-0.5 pr-2 text-[10px] font-semibold text-white shadow">
                        <Star className="size-3 fill-white text-white" />
                        Main
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="space-y-2">
        <Label className="text-[#1e293b]">Property video</Label>
        <div className="rounded-xl border border-dashed border-[#cbd5e1] bg-[#f8fafc] px-4 py-4">
          <p className="mb-2 text-sm text-[#64748b]">
            {videoFile ? `Selected: ${videoFile.name}` : "Upload an optional short property video (MP4, WebM, MOV)."}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleVideoBrowseClick}
              className="rounded-full bg-[var(--logo)] px-4 py-2 text-xs font-medium text-white shadow-sm transition-transform transition-colors duration-150 hover:-translate-y-0.5 hover:bg-[var(--logo-hover)] active:scale-95"
            >
              {videoFile ? "Replace video" : "Browse video"}
            </button>
            {videoFile && (
              <button
                type="button"
                onClick={() => onVideoFileChange(null)}
                className="rounded-full border border-[#cbd5e1] bg-white px-4 py-2 text-xs font-medium text-[#475569] transition-colors hover:bg-[#f1f5f9]"
              >
                Remove video
              </button>
            )}
          </div>
          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={handleVideoChange}
          />
          {videoPreviewUrl && (
            <video controls className="mt-3 max-h-56 w-full rounded-lg border border-[#e2e8f0] bg-black">
              <source src={videoPreviewUrl} type={videoFile?.type || "video/mp4"} />
            </video>
          )}
        </div>
      </div>
    </div>
  );
}
