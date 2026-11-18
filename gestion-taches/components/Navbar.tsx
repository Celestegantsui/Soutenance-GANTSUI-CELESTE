"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { useNotifications } from "@/lib/NotificationContext";
import { useLayout } from "@/lib/LayoutContext";
import { useThemeColors } from "@/lib/useThemeColors";
import { getPalette } from "@/lib/themeColors";
import ThemeColorPicker from "@/components/ThemeColorPicker";
import AppBrandName from "@/components/AppBrandName";
import { useState } from "react";
import {
  IconMenu,
  IconClipboard,
  IconBell,
  IconChevronDown,
} from "@/components/icons";

function getDisplayName(user: { name?: string; email?: string } | null) {
  if (!user) return "";
  if (user.name) return user.name;
  return user.email?.split("@")[0] ?? "";
}

function getInitial(user: { name?: string; email?: string } | null) {
  const name = getDisplayName(user);
  return name ? name.charAt(0).toUpperCase() : "?";
}

function isAdminRole(role?: string) {
  const normalizedRole = role?.trim().toLowerCase();
  return normalizedRole === "admin" || normalizedRole === "administrateur";
}

const loginPalette = getPalette("cyan");

export default function Navbar() {
  const router = useRouter();
  const { user, logout, isAuthenticated, loading } = useAuth();
  const { unreadCount } = useNotifications();
  const { toggleSidebar } = useLayout();
  const { colors, canCustomize } = useThemeColors();
  const [showMenu, setShowMenu] = useState(false);

  if (loading) {
    return (
      <header
        style={{ backgroundColor: loginPalette.bg }}
        className="text-white h-14 flex items-center px-4 shadow-md"
      >
        <AppBrandName className="font-semibold text-lg" />
        <span className="ml-auto text-sm opacity-80">Chargement...</span>
      </header>
    );
  }

  if (!isAuthenticated) {
    return (
      <header
        style={{ backgroundColor: loginPalette.bg }}
        className="text-white h-14 flex items-center px-6 shadow-md"
      >
        <div className="flex items-center gap-2">
          <IconClipboard size={22} />
          <AppBrandName className="font-semibold text-lg" />
        </div>
        <button
          onClick={() => router.push("/login")}
          className="ml-auto bg-white px-5 py-1.5 rounded-lg font-semibold hover:bg-gray-100 transition text-sm"
          style={{ color: loginPalette.bg }}
        >
          Connexion
        </button>
      </header>
    );
  }

  const displayName = getDisplayName(user);
  const initial = getInitial(user);

  return (
    <header
      style={{ backgroundColor: colors.bg }}
      className="text-white h-14 flex items-center px-4 shadow-md z-30 relative"
    >
      <button
        onClick={toggleSidebar}
        className="p-2 rounded-lg hover:bg-white/10 transition mr-2"
        aria-label="Menu"
      >
        <IconMenu size={22} />
      </button>

      <div className="flex items-center gap-2">
        <IconClipboard size={20} />
        <AppBrandName className="font-semibold text-lg hidden sm:inline" />
      </div>

      <div className="ml-auto flex items-center gap-3">
        <button
          onClick={() => router.push("/notifications")}
          className="relative p-2 rounded-lg hover:bg-white/10 transition"
          title="Notifications"
        >
          <IconBell size={22} />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>

        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-white/10 transition"
          >
            <span
              className="w-8 h-8 rounded-full bg-white font-bold text-sm flex items-center justify-center"
              style={{ color: colors.bg }}
            >
              {initial}
            </span>
            <span className="hidden sm:inline text-sm font-medium">{displayName}</span>
            <IconChevronDown />
          </button>

          {showMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 mt-2 w-56 bg-white text-gray-800 rounded-xl shadow-xl z-50 overflow-hidden border border-gray-100">
                <a href="/dashboard" className="block px-4 py-2.5 hover:bg-gray-50 text-sm">
                  Dashboard
                </a>
                <a href="/tasks" className="block px-4 py-2.5 hover:bg-gray-50 text-sm">
                  Tâches
                </a>
                <a href="/notifications" className="block px-4 py-2.5 hover:bg-gray-50 text-sm">
                  Notifications {unreadCount > 0 && `(${unreadCount})`}
                </a>
                {isAdminRole(user?.role) && (
                  <a href="/history" className="block px-4 py-2.5 hover:bg-gray-50 text-sm">
                    Historique
                  </a>
                )}

                {canCustomize && (
                  <ThemeColorPicker onClose={() => setShowMenu(false)} />
                )}

                <button
                  onClick={() => logout().then(() => router.push("/login"))}
                  className="w-full text-left px-4 py-2.5 hover:bg-red-50 text-red-600 text-sm border-t"
                >
                  Déconnexion
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
