"use client";

/**
 * Global Floating Action Button to add a new property.
 * Instantiates the AddPropertyModal.
 */
import * as React from "react";
import { Plus } from "lucide-react";
import { useProperties } from "@/contexts/PropertiesContext";
import { AddPropertyModal } from "./AddPropertyModal";

export function AddPropertyFab() {
  const [open, setOpen] = React.useState(false);
  const { refetchProperties } = useProperties();

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-8 right-8 z-40 flex size-14 items-center justify-center rounded-full bg-[var(--logo)] text-white shadow-lg transition-transform hover:scale-105 hover:bg-[var(--logo-hover)] focus:outline-none focus:ring-4 focus:ring-[var(--logo)]/30 active:scale-95"
        aria-label="Add Property"
      >
        <Plus className="size-6" strokeWidth={2.5} />
      </button>

      {/* The modal handles internally the multiple steps, starting from Basic Information (Step 1) */}
      {open && (
        <AddPropertyModal
          open={open}
          onClose={() => setOpen(false)}
          onPropertyAdded={() => void refetchProperties()}
        />
      )}
    </>
  );
}
