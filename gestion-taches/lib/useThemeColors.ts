"use client";

import { useTheme } from "@/lib/ThemeContext";
import { getPalette } from "@/lib/themeColors";

export function useThemeColors() {
  const { primaryColor, canCustomize } = useTheme();
  const colors = getPalette(primaryColor);
  return { colors, primaryColor, canCustomize };
}
