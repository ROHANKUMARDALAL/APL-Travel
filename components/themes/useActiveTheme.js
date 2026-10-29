"use client";

import { useSite } from "@/components/site/SiteProvider";

const THEMES = new Set(["CLASSIC_TRAVEL", "MODERN_EXPLORER", "LUXURY_ESCAPE"]);

export function useActiveTheme() {
  const { theme } = useSite();
  const code = String(theme?.code || "CLASSIC_TRAVEL").toUpperCase();
  return THEMES.has(code) ? code : "CLASSIC_TRAVEL";
}
