"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";

interface ThemeContextType {
  primaryColor: string;
  setPrimaryColor: (color: string) => void;
  accentColor: string;
  setAccentColor: (color: string) => void;
  canCustomize: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const themeOptions = [
  { name: "Bleu", value: "blue", bg: "bg-blue-600", bgHover: "hover:bg-blue-700", bgLighter: "bg-blue-500", bgLight: "bg-blue-100" },
  { name: "Rouge", value: "red", bg: "bg-red-600", bgHover: "hover:bg-red-700", bgLighter: "bg-red-500", bgLight: "bg-red-100" },
  { name: "Vert", value: "green", bg: "bg-green-600", bgHover: "hover:bg-green-700", bgLighter: "bg-green-500", bgLight: "bg-green-100" },
  { name: "Pourpre", value: "purple", bg: "bg-purple-600", bgHover: "hover:bg-purple-700", bgLighter: "bg-purple-500", bgLight: "bg-purple-100" },
  { name: "Orange", value: "orange", bg: "bg-orange-600", bgHover: "hover:bg-orange-700", bgLighter: "bg-orange-500", bgLight: "bg-orange-100" },
  { name: "Rose", value: "pink", bg: "bg-pink-600", bgHover: "hover:bg-pink-700", bgLighter: "bg-pink-500", bgLight: "bg-pink-100" },
  { name: "Indigo", value: "indigo", bg: "bg-indigo-600", bgHover: "hover:bg-indigo-700", bgLighter: "bg-indigo-500", bgLight: "bg-indigo-100" },
  { name: "Cyan", value: "cyan", bg: "bg-cyan-600", bgHover: "hover:bg-cyan-700", bgLighter: "bg-cyan-500", bgLight: "bg-cyan-100" },
  { name: "Marron", value: "brown", bg: "bg-amber-800", bgHover: "hover:bg-amber-900", bgLighter: "bg-amber-700", bgLight: "bg-amber-100" },
];

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [primaryColor, setPrimaryColorState] = useState<string>("blue");
  const [accentColor, setAccentColorState] = useState<string>("blue");

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === "admin") {
        const savedColor = localStorage.getItem(`theme-primary-${user.id}`) || "cyan";
        const savedAccent = localStorage.getItem(`theme-accent-${user.id}`) || "cyan";
        setPrimaryColorState(savedColor);
        setAccentColorState(savedAccent);
      } else {
        setPrimaryColorState("blue");
        setAccentColorState("blue");
      }
    } else {
      setPrimaryColorState("blue");
      setAccentColorState("blue");
    }
  }, [user?.id, user?.role, isAuthenticated]);

  const setPrimaryColor = (color: string) => {
    if (user?.role !== "admin") return;
    setPrimaryColorState(color);
    localStorage.setItem(`theme-primary-${user.id}`, color);
  };

  const setAccentColor = (color: string) => {
    if (user?.role !== "admin") return;
    setAccentColorState(color);
    localStorage.setItem(`theme-accent-${user.id}`, color);
  };

  return (
    <ThemeContext.Provider
      value={{
        primaryColor,
        setPrimaryColor,
        accentColor,
        setAccentColor,
        canCustomize: user?.role === "admin",
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}

export function getThemeColor(colorValue: string) {
  return themeOptions.find((t) => t.value === colorValue) || themeOptions[0];
}
