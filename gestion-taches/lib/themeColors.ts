export interface ThemePalette {
  bg: string;
  bgHover: string;
  bgLight: string;
  bgMuted: string;
  text: string;
}

export const colorMap: Record<string, ThemePalette> = {
  blue: { bg: "#1e40af", bgHover: "#1e3a8a", bgLight: "#eff6ff", bgMuted: "#dbeafe", text: "#1e40af" },
  red: { bg: "#dc2626", bgHover: "#b91c1c", bgLight: "#fef2f2", bgMuted: "#fecaca", text: "#dc2626" },
  green: { bg: "#15803d", bgHover: "#166534", bgLight: "#f0fdf4", bgMuted: "#bbf7d0", text: "#15803d" },
  purple: { bg: "#7e22ce", bgHover: "#6b21a8", bgLight: "#faf5ff", bgMuted: "#e9d5ff", text: "#7e22ce" },
  orange: { bg: "#ea580c", bgHover: "#c2410c", bgLight: "#fff7ed", bgMuted: "#fed7aa", text: "#ea580c" },
  pink: { bg: "#db2777", bgHover: "#be185d", bgLight: "#fdf2f8", bgMuted: "#fbcfe8", text: "#db2777" },
  indigo: { bg: "#4f46e5", bgHover: "#4338ca", bgLight: "#f0f4ff", bgMuted: "#c7d2fe", text: "#4f46e5" },
  cyan: { bg: "#006666", bgHover: "#004d40", bgLight: "#e0f2f1", bgMuted: "#b2dfdb", text: "#008080" },
  brown: { bg: "#92400e", bgHover: "#78350f", bgLight: "#fef3c7", bgMuted: "#fde68a", text: "#92400e" },
};

export function getPalette(colorKey: string): ThemePalette {
  return colorMap[colorKey] ?? colorMap.cyan;
}
