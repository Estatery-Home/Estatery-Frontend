/**
 * Utility helpers used across the app.
 */
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines class names and resolves Tailwind conflicts.
 * clsx() joins strings/objects; twMerge() makes sure later classes override earlier ones
 * (e.g. "p-2 p-4" becomes "p-4" instead of both applying).
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
