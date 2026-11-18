"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import axios from "@/lib/axiosConfig";
import { useAuth } from "@/lib/AuthContext";
import { useNotifications } from "@/lib/NotificationContext";
import { useThemeColors } from "@/lib/useThemeColors";
import AppBrandName from "@/components/AppBrandName";
import {
  IconClipboard,
  IconShieldCheck,
  IconBell,
  IconTrendUp,
  IconTrendFlat,
  IconZap,
  IconCalendar,
  IconArrowRight,
  IconClock,
  DashboardIllustration,
} from "@/components/icons";

const FRIDAY_TEAMS_CALL_URL =
  process.env.NEXT_PUBLIC_FRIDAY_TEAMS_CALL_URL ||
  "https://teams.live.com/meet/9314718688078?p=G3McF8Ngxb1KQWQG3m";

function getDisplayName(user: { name?: string; email?: string } | null) {
  if (!user) return "utilisateur";
  if (user.name) return user.name;
  return user.email?.split("@")[0] ?? "utilisateur";
}

interface StatCardProps {
  label: string;
  value: number;
  href: string;
  icon: React.ReactNode;
  trendIcon: React.ReactNode;
  iconBg: string;
}

function StatCard({ label, value, href, icon, trendIcon, iconBg }: StatCardProps) {
  return (
    <Link
      href={href}
      className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col gap-4 transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
    >
      <div className="flex items-start justify-between">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${iconBg}`}>
          {icon}
        </div>
        {trendIcon}
      </div>
      <div>
        <p className="text-sm text-gray-500 mb-1">{label}</p>
        <p className="text-4xl font-bold text-gray-900">{value}</p>
      </div>
    </Link>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const { colors } = useThemeColors();
  const [inProgressCount, setInProgressCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [overdueTasksCount, setOverdueTasksCount] = useState(0);

  const fetchCounts = async () => {
    try {
      const res = await axios.get("/api/tasks");
      const tasks = Array.isArray(res.data?.tasks) ? res.data.tasks : [];
      const completed = tasks.filter(
        (t: { status: string }) =>
          String(t.status).toLowerCase() === "terminé" ||
          String(t.status).toLowerCase() === "termine"
      ).length;
      setCompletedCount(completed);
      setInProgressCount(tasks.length - completed);
      setOverdueTasksCount(res.data.overdue_tasks_count);
    } catch (err) {
      console.error("Erreur fetch dashboard tasks:", err);
    }
  };

  useEffect(() => {
    fetchCounts();
    const id = setInterval(fetchCounts, 5000);
    return () => clearInterval(id);
  }, []);

  const displayName = getDisplayName(user);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div
        className="relative overflow-hidden rounded-2xl px-6 py-5 flex items-center gap-4"
        style={{
          background: `linear-gradient(135deg, ${colors.bgLight} 0%, ${colors.bgMuted} 50%, ${colors.bgLight} 100%)`,
        }}
      >
        <div
          className="absolute right-0 top-0 bottom-0 w-1/2 opacity-30 pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 100'%3E%3Cpath d='M0 50 Q100 0 200 50 T400 50 V100 H0Z' fill='%23008080' fill-opacity='0.15'/%3E%3Cpath d='M0 70 Q150 30 300 70 T400 70 V100 H0Z' fill='%23006666' fill-opacity='0.1'/%3E%3C/svg%3E")`,
            backgroundSize: "cover",
          }}
        />
        <span
          className="relative z-10 w-12 h-12 rounded-full flex items-center justify-center text-2xl shrink-0 text-white"
          style={{ backgroundColor: colors.bg }}
        >
          👋
        </span>
        <div className="relative z-10">
          <p className="font-semibold text-gray-800 text-lg">
            Bonjour, {displayName} !
          </p>
          <p className="text-gray-600 text-sm">
            Bienvenue sur <AppBrandName className="font-medium text-gray-700" />.
          </p>
        </div>
      </div>

      <h1 className="text-3xl font-bold text-gray-900">Tableau de bord</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          label="Tâches en cours"
          value={inProgressCount}
          href="/tasks?filter=in-progress"
          iconBg="bg-blue-50"
          icon={<IconClipboard className="text-blue-600" size={24} />}
          trendIcon={<IconTrendUp className="text-blue-400" size={20} />}
        />
        <StatCard
          label="Tâches terminées"
          value={completedCount}
          href="/tasks?filter=completed"
          iconBg="bg-green-50"
          icon={<IconShieldCheck className="text-green-600" size={24} />}
          trendIcon={<IconTrendUp className="text-green-400" size={20} />}
        />
        <StatCard
          label="Notifications"
          value={unreadCount}
          href="/notifications"
          iconBg="bg-orange-50"
          icon={<IconBell className="text-orange-500" size={24} />}
          trendIcon={<IconTrendFlat className="text-orange-300" size={20} />}
        />
        <StatCard
          label="Tâches en retard"
          value={overdueTasksCount}
          href="/tasks?filter=overdue"
          iconBg="bg-red-50"
          icon={<IconClock className="text-red-600" size={24} />}
          trendIcon={<IconTrendFlat className="text-red-300" size={20} />}
        />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="flex flex-col lg:flex-row lg:items-center gap-8">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <IconZap className="text-blue-600" size={22} />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Actions rapides</h2>
            </div>
            <p className="text-gray-500 text-sm mb-6">
              Accédez rapidement aux actions les plus utilisées.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/view-tasks"
                className="inline-flex items-center justify-center gap-2 text-white px-6 py-3.5 rounded-xl font-medium transition shadow-sm hover:opacity-90"
                style={{ backgroundColor: colors.bg }}
              >
                <IconClipboard size={20} />
                Voir les tâches
                <IconArrowRight size={18} />
              </Link>
              <a
                href={FRIDAY_TEAMS_CALL_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-[#2E7D32] hover:bg-[#1B5E20] text-white px-6 py-3.5 rounded-xl font-medium transition shadow-sm"
              >
                <IconCalendar size={20} />
                Réunion du vendredi
                <IconArrowRight size={18} />
              </a>
            </div>
          </div>

          <div className="hidden lg:flex items-center justify-center shrink-0">
            <DashboardIllustration className="w-48 h-40" />
          </div>
        </div>
      </div>
    </div>
  );
}
