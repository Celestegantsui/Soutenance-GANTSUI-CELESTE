"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { useNotifications } from "@/lib/NotificationContext";
import { useLayout } from "@/lib/LayoutContext";
import { useThemeColors } from "@/lib/useThemeColors";
import ThemeColorPicker from "@/components/ThemeColorPicker";
import { useState } from "react";
import {
  IconHome,
  IconClipboard,
  IconBell,
  IconCalendar,
  IconClock,
  IconChevronDown,
} from "@/components/icons";

const menu = [
  { name: "Dashboard", path: "/dashboard", icon: IconHome },
  { name: "Tâches", path: "/tasks", icon: IconClipboard },
  { name: "Notifications", path: "/notifications", icon: IconBell, badge: true },
  { name: "Réunion du vendredi", path: "/weekly-report", icon: IconCalendar },
  { name: "Historique", path: "/history", icon: IconClock },
];

function getDisplayName(user: { name?: string; email?: string } | null) {
  if (!user) return "";
  if (user.name) return user.name;
  return user.email?.split("@")[0] ?? "";
}

function getRoleLabel(role?: string) {
  if (!role) return "Utilisateur";
  if (role.toLowerCase() === "admin") return "Administrateur";
  return role.charAt(0).toUpperCase() + role.slice(1);
}

function isAdminRole(role?: string) {
  const normalizedRole = role?.trim().toLowerCase();
  return normalizedRole === "admin" || normalizedRole === "administrateur";
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const { sidebarOpen, setSidebarOpen } = useLayout();
  const { colors, canCustomize } = useThemeColors();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const displayName = getDisplayName(user);
  const initial = displayName ? displayName.charAt(0).toUpperCase() : "?";

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-20 lg:hidden top-14"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-20 top-14 lg:top-0
          w-64 bg-white border-r border-gray-100 flex flex-col
          transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:hidden"}
          min-h-[calc(100vh-3.5rem)] lg:min-h-screen
        `}
      >
        <div className="flex-1 overflow-y-auto p-5">
          <div className="flex items-center justify-center mb-8">
            <div className="relative w-28 h-28">
              <svg viewBox="0 0 200 200" className="absolute inset-0 w-full h-full rotating" aria-hidden="true">
                <defs>
                  <path id="circlePath" d="M100,100 m-75,0 a75,75 0 1,1 150,0 a75,75 0 1,1 -150,0" />
                </defs>
                <text fontSize="11" fill="#6b7280">
                  <textPath href="#circlePath" startOffset="0">
                    Agence de Régulation des Postes et des Communications Électroniques
                  </textPath>
                </text>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="rounded-full bg-white p-2 shadow-md w-20 h-20 flex items-center justify-center overflow-hidden">
                  <Image
                    src="/logo.PNG"
                    alt="Logo ARPCE"
                    width={64}
                    height={64}
                    className="object-contain rounded-full"
                  />
                </div>
              </div>
            </div>
          </div>

          <style jsx>{`
            .rotating {
              transform-origin: 50% 50%;
              animation: spin 18s linear infinite;
            }
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}</style>

          <nav>
            <ul className="space-y-1">
              {menu.filter((item) => item.path !== "/history" || isAdminRole(user?.role)).map((item) => {
                const isActive = pathname === item.path;
                const Icon = item.icon;
                return (
                  <li key={item.path}>
                    <Link
                      href={item.path}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition"
                      style={
                        isActive
                          ? { backgroundColor: colors.bgLight, color: colors.text }
                          : undefined
                      }
                    >
                      <span
                        className={isActive ? "" : "text-gray-400"}
                        style={isActive ? { color: colors.text } : undefined}
                      >
                        <Icon size={20} />
                      </span>
                      <span className={`flex-1 ${!isActive ? "text-gray-600" : ""}`}>{item.name}</span>
                      {item.badge && (
                        <span
                          className="text-white text-xs font-semibold rounded-full min-w-[22px] h-[22px] flex items-center justify-center px-1.5"
                          style={{ backgroundColor: colors.bg }}
                        >
                          {unreadCount}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
              {isAdminRole(user?.role) && (
                <li>
                  <Link
                    href="/users"
                    className="flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition"
                    style={pathname === "/users" ? { backgroundColor: colors.bgLight, color: colors.text } : undefined}
                  >
                    <span className={pathname === "/users" ? "" : "text-gray-400"}>👥</span>
                    <span className={pathname === "/users" ? "flex-1" : "flex-1 text-gray-600"}>Gestion des comptes</span>
                  </Link>
                </li>
              )}
            </ul>
          </nav>
        </div>

        <div className="p-4 border-t border-gray-100">
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="w-full flex items-center gap-3 p-3 rounded-xl transition hover:opacity-90"
              style={{ backgroundColor: colors.bgLight }}
            >
              <span
                className="w-10 h-10 rounded-full text-white font-bold flex items-center justify-center shrink-0"
                style={{ backgroundColor: colors.bg }}
              >
                {initial}
              </span>
              <div className="flex-1 text-left min-w-0">
                <p className="font-semibold text-sm text-gray-800 truncate">{displayName}</p>
                <p className="text-xs" style={{ color: colors.text }}>
                  {getRoleLabel(user?.role)}
                </p>
              </div>
              <IconChevronDown className="text-gray-400 shrink-0" />
            </button>

            {showProfileMenu && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setShowProfileMenu(false)} />
                <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-xl shadow-lg border border-gray-100 z-40 overflow-hidden w-64">
                  {canCustomize && (
                    <ThemeColorPicker onClose={() => setShowProfileMenu(false)} />
                  )}
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 border-t"
                  >
                    Déconnexion
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
