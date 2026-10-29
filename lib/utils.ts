import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format date nicely with month abbreviation e.g. "12 Oct 2026" or "12 Oct"
 */
export function formatDate(dateInput: string | number | Date | null | undefined, includeYear: boolean = true): string {
  if (!dateInput) return "—";
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return String(dateInput);
    const day = d.getDate();
    const month = d.toLocaleString("en-US", { month: "short" });
    const year = d.getFullYear();
    return includeYear ? `${day} ${month} ${year}` : `${day} ${month}`;
  } catch {
    return String(dateInput);
  }
}

