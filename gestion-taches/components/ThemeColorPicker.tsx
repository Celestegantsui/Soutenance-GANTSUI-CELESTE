"use client";

import { useTheme, themeOptions } from "@/lib/ThemeContext";
import { colorMap } from "@/lib/themeColors";

interface ThemeColorPickerProps {
  onClose?: () => void;
  className?: string;
}

export default function ThemeColorPicker({ onClose, className = "" }: ThemeColorPickerProps) {
  const { primaryColor, setPrimaryColor, canCustomize } = useTheme();

  if (!canCustomize) return null;

  return (
    <div className={`p-3 border-t border-gray-100 ${className}`}>
      <p className="font-semibold text-sm text-gray-700 mb-3">Personnaliser la couleur</p>
      <div className="grid grid-cols-2 gap-2">
        {themeOptions.map((theme) => {
          const palette = colorMap[theme.value];
          const isSelected = primaryColor === theme.value;
          return (
            <button
              key={theme.value}
              type="button"
              onClick={() => {
                setPrimaryColor(theme.value);
                onClose?.();
              }}
              style={{
                backgroundColor: isSelected ? palette.bg : palette.bgLight,
                color: isSelected ? "#fff" : palette.text,
                border: isSelected ? "2px solid #9ca3af" : "1px solid transparent",
              }}
              className="px-3 py-2 rounded-lg text-sm font-medium transition hover:opacity-90"
            >
              {theme.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
