"use client";

/**
 * Properties page header – title + Add New Property button.
 */
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

type PropertiesPageHeaderProps = {
  onAddProperty: () => void;
};

export function PropertiesPageHeader({ onAddProperty }: PropertiesPageHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-[#1e293b]">My Property</h1>
        <p className="mt-1 text-[#64748b]">
          Track and manage your property dashboard efficiently.
        </p>
      </div>
      <Button
        onClick={onAddProperty}
        className="bg-[var(--logo)] text-white hover:bg-[var(--logo-hover)]"
      >
        <Plus className="mr-2 size-4" />
        Add New Property
      </Button>
    </div>
  );
}
