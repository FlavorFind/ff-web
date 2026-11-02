import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { CSSProperties } from "react";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Lets inline styles carry CSS custom properties without casts. */
export type CSSVars = CSSProperties & { [key: `--${string}`]: string | number };
