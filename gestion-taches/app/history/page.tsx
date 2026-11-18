"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { jsPDF } from "jspdf";
import axios from "axios";
import Link from "next/link";
import {
  IconCalendar,
  IconClock,
  IconClipboard,
  IconTrendUp,
} from "@/components/icons";
import {
  MonthlyArchive,
  MonthlyTask,
  getCurrentMonthKey,
} from "@/lib/historyStorage";
import { useAuth } from "@/lib/AuthContext";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"; 
const MONTHS = [ 
  "Janvier", 
  "Février", 
  "Mars", 
  "Avril", 
  "Mai", 
  "Juin", 
  "Juillet", 
  "Août", 
  "Septembre", 
  "Octobre", 
  "Novembre", 
  "Décembre", 
]; 
 
type FilterState = { 
  technician: string; 
  status: string; 
}; 
 
type PeriodStats = { 
  completionRate: number; 
  totalTasks: number; 
  averageCompletionTime: number; 
  delayedTasks: number | null;
  remainingTasksRate: number; 
  completedTasks: number; 
  pendingTasks: number; 
  totalMeetings: number; 
}; 
 
type PeriodChartPoint = { 
  month: string; 
  completionRate: number; 
  totalTasks: number; 
  averageCompletionTime: number; 
}; 
 
const isCompleted = (status: string) => 
  ["terminé", "termine", "completed"].includes(status.trim().toLowerCase()); 
 
const isInProgress = (status: string) => 
  status.trim().toLowerCase() === "en cours" || status.trim().toLowerCase() === "in-progress"; 
 
const isPending = (status: string) => 
  status.trim().toLowerCase() === "en attente" || status.trim().toLowerCase() === "pending"; 
 
const normalizeStatus = (status: string) => { 
  const value = status.trim().toLowerCase(); 
  if (isCompleted(value)) return "Terminé"; 
  if (isInProgress(value)) return "En cours"; 
  if (isPending(value)) return "En attente"; 
  return value; 
}; 
 
const getInitials = (name: string) => 
  name 
    .trim() 
    .split(/\s+/) 
    .slice(0, 2) 
    .map((part) => part[0]?.toUpperCase()) 
    .join("") || "?"; 
 
const getFilteredTasks = (archive: MonthlyArchive, filters: FilterState) => 
  archive.tasks.filter((task) => {
    const technicianMatches = filters.technician === "Tous" || task.assignedTo === filters.technician;
    const statusMatches = filters.status === "Tous" || normalizeStatus(task.status) === filters.status;
    return technicianMatches && statusMatches;
  }); 

const getTaskDueDate = (task: MonthlyArchive["tasks"][number]) =>
  (task.endDate || task.end_date)?.slice(0, 10);

const getMonthlyCompletionRate = (archive: MonthlyArchive, filters: FilterState) => {
  const archivedTasks = getFilteredTasks(archive, filters);
  if (!archivedTasks.length) return 0;

  const nextMonth = new Date(archive.year, archive.monthNumber, 1);
  const nextMonthStart = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, "0")}-01`;
  const completedByMonthEnd = archivedTasks.filter((task) => {
    if (!isCompleted(task.status)) return false;
    const completedDate = (task.completedDate || task.completed_date)?.slice(0, 10);
    return !completedDate || completedDate < nextMonthStart;
  }).length;

  return (completedByMonthEnd / archivedTasks.length) * 100;
};

const isTaskLateInArchive = (task: MonthlyArchive["tasks"][number], archive: MonthlyArchive) => {
  const status = task.status.trim().toLowerCase();
  if (status.includes("retard") || status === "overdue") return true;

  const dueDate = getTaskDueDate(task);
  if (!dueDate) return false;

  const nextMonth = new Date(archive.year, archive.monthNumber, 1);
  const nextMonthStart = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, "0")}-01`;
  if (dueDate >= nextMonthStart) return false;

  if (!isCompleted(task.status)) return true;
  const completedDate = task.completedDate?.slice(0, 10);
  return Boolean(completedDate && completedDate > dueDate);
};

const getArchivedLateTaskIds = (archive: MonthlyArchive, filters: FilterState, includeResolved = true) =>
  new Set(
    getFilteredTasks(archive, filters)
      .filter((task) => isTaskLateInArchive(task, archive) && (includeResolved || !isCompleted(task.status)))
      .map((task) => String(task.id)),
  );

const getArchivedDelayedTaskCount = (archive: MonthlyArchive, filters: FilterState): number | null => {
  const tasks = getFilteredTasks(archive, filters);
  if (filters.technician === "Tous" && filters.status === "Tous") {
    const storedCount = [
      archive.stats?.delayedTasks,
      archive.stats?.overdueTasksCount,
      archive.stats?.overdue_tasks_count,
      archive.overdueTasksCount,
      archive.overdue_tasks_count,
    ].find((value) => typeof value === "number" && Number.isFinite(value));
    if (typeof storedCount === "number") return storedCount;
  }

  const hasTaskLevelData = tasks.some((task) => {
    const status = task.status.trim().toLowerCase();
    return (
      status.includes("retard") ||
      status === "overdue" ||
      Boolean(getTaskDueDate(task))
    );
  });

  if (hasTaskLevelData) {
    return getArchivedLateTaskIds(archive, filters).size;
  }

  return null;
};

const getFilteredStats = (archive: MonthlyArchive, filters: FilterState): PeriodStats => { 
  const tasks = getFilteredTasks(archive, filters); 
  const completedTasks = tasks.filter((task) => isCompleted(task.status)).length; 
  const totalTasks = tasks.length; 
  const completionTime = tasks 
    .filter((task) => isCompleted(task.status) && task.daysToComplete !== undefined) 
    .map((task) => task.daysToComplete as number); 
  const averageCompletionTime = completionTime.length 
    ? completionTime.reduce((sum, value) => sum + value, 0) / completionTime.length 
    : 0; 
 
  return { 
    completionRate: getMonthlyCompletionRate(archive, filters), 
    totalTasks, 
    averageCompletionTime, 
    delayedTasks: getArchivedDelayedTaskCount(archive, filters),
    remainingTasksRate: totalTasks ? ((totalTasks - completedTasks) / totalTasks) * 100 : 0, 
    completedTasks, 
    pendingTasks: tasks.filter((task) => isPending(task.status)).length, 
    totalMeetings: archive.meetings.length, 
  }; 
}; 
 
const getPreviousMonth = (archive: MonthlyArchive) => { 
  const previousMonth = new Date(archive.year, archive.monthNumber - 2, 1); 
  return `${previousMonth.getFullYear()}-${String(previousMonth.getMonth() + 1).padStart(2, "0")}`; 
}; 
 
const getComparison = (current: PeriodStats, previous?: PeriodStats) => { 
  if (!previous) return null; 
  const completionDifference = current.completionRate - previous.completionRate; 
  const taskDifference = current.totalTasks - previous.totalTasks; 
  const timeDifference = previous.averageCompletionTime 
    ? current.averageCompletionTime - previous.averageCompletionTime 
    : null; 
 
  return { 
    completionDifference, 
    taskDifference, 
    timeDifference, 
  }; 
}; 
 
const getTechnicianStats = (archive: MonthlyArchive, filters: FilterState) => { 
  const tasks = getFilteredTasks(archive, filters); 
  const grouped = new Map<string, { assigned: number; completed: number }>(); 
 
  tasks.forEach((task) => { 
    const technician = task.assignedTo || "Non affecté"; 
    const current = grouped.get(technician) || { assigned: 0, completed: 0 }; 
    current.assigned += 1; 
    if (isCompleted(task.status)) current.completed += 1; 
    grouped.set(technician, current); 
  }); 
 
  return Array.from(grouped.entries()) 
    .map(([name, values]) => ({ 
      name, 
      ...values, 
      completionRate: values.assigned ? (values.completed / values.assigned) * 100 : 0, 
    })) 
    .sort((a, b) => b.assigned - a.assigned || a.name.localeCompare(b.name)); 
}; 
 

type FrequentTaskSummary = {
  title: string;
  occurrences: number;
  averageDays: number | null;
};

const getTaskDurationDays = (task: MonthlyTask): number | null => {
  if (typeof task.daysToComplete === "number" && Number.isFinite(task.daysToComplete)) {
    return Math.max(0, task.daysToComplete);
  }
  if (!task.createdDate || !task.completedDate || !isCompleted(task.status)) return null;
  const start = new Date(task.createdDate).getTime();
  const end = new Date(task.completedDate).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return null;
  return (end - start) / 86_400_000;
};

const getMostFrequentTask = (archive: MonthlyArchive, filters: FilterState): FrequentTaskSummary | null => {
  const groups = new Map<string, { title: string; count: number; days: number[] }>();
  getFilteredTasks(archive, filters).forEach((task) => {
    const title = task.title?.trim() || "Tâche sans titre";
    const key = title.toLocaleLowerCase("fr-FR");
    const group = groups.get(key) || { title, count: 0, days: [] };
    group.count += 1;
    const duration = getTaskDurationDays(task);
    if (duration !== null) group.days.push(duration);
    groups.set(key, group);
  });
  const winner = Array.from(groups.values()).sort((a, b) => b.count - a.count || a.title.localeCompare(b.title, "fr"))[0];
  if (!winner) return null;
  return {
    title: winner.title,
    occurrences: winner.count,
    averageDays: winner.days.length ? winner.days.reduce((sum, days) => sum + days, 0) / winner.days.length : null,
  };
};

const getPeriodLabel = (archive: MonthlyArchive) => `${MONTHS[archive.monthNumber - 1]} ${archive.year}`; 
 
function DownloadIcon({ className = "h-4 w-4" }: { className?: string }) { 
  return ( 
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"> 
      <path d="M12 3v12M7 10l5 5 5-5M5 21h14" /> 
    </svg> 
  ); 
} 
 
function StatCard({ 
  title, 
  value, 
  detail, 
  icon, 
  tone, 
  comparison, 
  superscript,
}: { 
  title: string; 
  value: string; 
  detail: string; 
  icon: React.ReactNode; 
  tone: "green" | "blue" | "violet" | "orange"; 
  comparison?: string; 
  superscript?: string;
}) { 
  const colors = { 
    green: { icon: "bg-emerald-50 text-emerald-600", border: "border-emerald-100" }, 
    blue: { icon: "bg-sky-50 text-sky-600", border: "border-sky-100" }, 
    violet: { icon: "bg-violet-50 text-violet-600", border: "border-violet-100" }, 
    orange: { icon: "bg-orange-50 text-orange-600", border: "border-orange-100" }, 
  }; 
 
  return ( 
    <article className={`rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md ${colors[tone].border}`}> 
      <div className="flex items-start justify-between gap-4"> 
        <div> 
          <p className="text-sm font-medium text-slate-500">{title}</p> 
          <p className="mt-2 flex items-start text-3xl font-bold tracking-tight text-slate-900">
            {value}
            {superscript && <sup title="Tâches du mois précédent toujours en retard" className="ml-0.5 text-xs font-semibold text-orange-600">{superscript}</sup>}
          </p> 
        </div> 
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${colors[tone].icon}`}>{icon}</span> 
      </div> 
      <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs"> 
        <span className="text-slate-500">{detail}</span> 
        {comparison && ( 
          <span className={`font-semibold ${comparison.startsWith("+") ? "text-emerald-600" : comparison.startsWith("-") ? "text-orange-600" : "text-slate-500"}`}> 
            {comparison} 
          </span> 
        )} 
      </div> 
    </article> 
  ); 
} 
 
function EmptyState({ title, description }: { title: string; description: string }) { 
  return ( 
    <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center"> 
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500"> 
        <IconClipboard className="h-6 w-6" /> 
      </div> 
      <h3 className="mt-4 font-semibold text-slate-800">{title}</h3> 
      <p className="mt-1 text-sm text-slate-500">{description}</p> 
    </div> 
  ); 
} 
 
export default function HistoryPage() { 
  const { user } = useAuth(); 
  const [archives, setArchives] = useState<MonthlyArchive[]>([]); 
  const [liveOverdueTasks, setLiveOverdueTasks] = useState<Array<{ id: string; assignedTo: string; status: string }>>([]);
  const [liveOverdueTasksLoaded, setLiveOverdueTasksLoaded] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null); 
  const [selectedYear, setSelectedYear] = useState<number | null>(null); 
  const [viewMode, setViewMode] = useState<"monthly" | "yearly">("monthly"); 
  const [filters, setFilters] = useState<FilterState>({ technician: "Tous", status: "Tous" }); 
  const [loading, setLoading] = useState(true); 
  const [error, setError] = useState<string | null>(null); 
  const [isExporting, setIsExporting] = useState(false); 
 
  useEffect(() => { 
    if (user?.role?.toLowerCase() !== "admin") return; 
 
    let active = true; 
    const fetchArchives = async () => { 
      try { 
        const token = localStorage.getItem("auth_token"); 
        const response = await axios.get<MonthlyArchive[]>(`${API_URL}/api/history/monthly`, { 
          headers: token ? { Authorization: `Bearer ${token}` } : {}, 
          withCredentials: true, 
        }); 
        if (!active) return; 
        const data = Array.isArray(response.data) ? response.data : []; 
        const currentMonth = getCurrentMonthKey(); 
        setArchives(data); 
        setSelectedMonth((current) => current || data.find((archive) => archive.month === currentMonth)?.month || data[0]?.month || null); 
        setSelectedYear((current) => current || data[0]?.year || new Date().getFullYear()); 
      } catch { 
        if (active) setError("Impossible de charger l’historique. Vérifiez l’API et votre connexion."); 
      } finally { 
        if (active) setLoading(false); 
      } 
    }; 
 
    void fetchArchives(); 
    return () => { 
      active = false; 
    }; 
  }, [user]); 

  useEffect(() => {
    if (user?.role?.toLowerCase() !== "admin") return;

    let active = true;
    const fetchLiveOverdueTasks = async () => {
      try {
        const token = localStorage.getItem("auth_token");
        const response = await axios.get<{
          tasks?: Array<{
            id: string | number;
            status?: string;
            end_date?: string;
            technician_name?: string;
            technician?: { name?: string };
          }>;
        }>(`${API_URL}/api/tasks`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          withCredentials: true,
        });
        if (!active) return;

        const today = new Date().toISOString().slice(0, 10);
        const tasks = Array.isArray(response.data?.tasks) ? response.data.tasks : [];
        setLiveOverdueTasks(tasks
          .filter((task) =>
            Boolean(task.end_date) &&
            task.end_date!.slice(0, 10) < today &&
            !isCompleted(task.status || ""),
          )
          .map((task) => ({
            id: String(task.id),
            assignedTo: task.technician_name || task.technician?.name || "Non affecté",
            status: task.status || "",
          })));
        setLiveOverdueTasksLoaded(true);
      } catch (requestError) {
        console.error("Erreur chargement des tâches encore en retard:", requestError);
      }
    };

    void fetchLiveOverdueTasks();
    const interval = setInterval(fetchLiveOverdueTasks, 5000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [user]);

  const availableYears = useMemo( 
    () => Array.from(new Set(archives.map((archive) => archive.year))).sort((a, b) => b - a), 
    [archives], 
  ); 
 
  const monthOptions = useMemo(() => {
    const years = new Set(availableYears);
    if (selectedYear) years.add(selectedYear);
    if (!years.size) years.add(new Date().getFullYear());
    return Array.from(years)
      .sort((a, b) => b - a)
      .flatMap((year) => MONTHS.map((label, index) => ({
        value: `${year}-${String(index + 1).padStart(2, "0")}`,
        label: `${label} ${year}`,
      })));
  }, [availableYears, selectedYear]);

  const selectedArchive = archives.find((archive) => archive.month === selectedMonth) || null; 
  const previousArchive = selectedArchive ? archives.find((archive) => archive.month === getPreviousMonth(selectedArchive)) : null; 
  const currentStats = selectedArchive ? getFilteredStats(selectedArchive, filters) : null; 
  const previousStats = previousArchive ? getFilteredStats(previousArchive, filters) : null; 
  const comparison = currentStats && previousStats ? getComparison(currentStats, previousStats) : null; 
  const overdueCarryoverCount = selectedArchive && previousArchive
    ? (() => {
      const previousLateIds = getArchivedLateTaskIds(previousArchive, filters);
      const currentMonth = getCurrentMonthKey();
      const currentLateIds = selectedArchive.month === currentMonth
        ? liveOverdueTasksLoaded
          ? new Set(liveOverdueTasks
            .filter((task) =>
              (filters.technician === "Tous" || task.assignedTo === filters.technician) &&
              (filters.status === "Tous" || normalizeStatus(task.status) === filters.status))
            .map((task) => task.id))
          : null
        : getArchivedLateTaskIds(selectedArchive, filters, false);
      if (!currentLateIds) return null;
      return Array.from(previousLateIds).filter((id) => currentLateIds.has(id)).length;
    })()
    : null;
  const technicians = useMemo( 
    () => Array.from(new Set(archives.flatMap((archive) => archive.tasks.map((task) => task.assignedTo)).filter(Boolean))).sort(), 
    [archives], 
  ); 
 
  const monthlyChartData: PeriodChartPoint[] = useMemo(
    () => MONTHS.map((monthName, index) => {
      const archive = archives.find((item) => item.year === selectedYear && item.monthNumber === index + 1);
      const stats = archive ? getFilteredStats(archive, filters) : null;
      return {
        month: monthName.slice(0, 3),
        completionRate: Math.round((stats?.completionRate ?? 0) * 10) / 10,
        totalTasks: stats?.totalTasks ?? 0,
        averageCompletionTime: Math.round((stats?.averageCompletionTime ?? 0) * 10) / 10,
      };
    }),
    [archives, filters, selectedYear],
  );
 
  const monthlyDetails = useMemo( 
    () => archives 
      .filter((archive) => archive.year === selectedYear) 
      .sort((a, b) => a.monthNumber - b.monthNumber) 
      .map((archive) => ({ archive, stats: getFilteredStats(archive, filters) })), 
    [archives, filters, selectedYear], 
  ); 
 
  const technicianStats = selectedArchive ? getTechnicianStats(selectedArchive, filters) : [];
  const mostFrequentTask = selectedArchive ? getMostFrequentTask(selectedArchive, filters) : null; 
 
  const exportPdf = async () => {
    if (!selectedArchive || !currentStats) return;
    setIsExporting(true);
    try {
      const doc = new jsPDF("p", "mm", "a4");
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const margin = 14;
      const contentW = pageW - margin * 2;
      const navy: [number, number, number] = [18, 54, 87];
      const teal: [number, number, number] = [8, 117, 104];
      const green: [number, number, number] = [16, 153, 130];
      const blue: [number, number, number] = [40, 118, 210];
      const violet: [number, number, number] = [139, 65, 207];
      const orange: [number, number, number] = [234, 112, 27];
      const muted: [number, number, number] = [100, 116, 139];
      const border: [number, number, number] = [222, 230, 235];
      const pale: [number, number, number] = [246, 249, 250];

      const write = (value: string, x: number, y: number, size: number, color: [number, number, number] = navy, bold = false, maxWidth?: number) => {
        doc.setFont("helvetica", bold ? "bold" : "normal");
        doc.setFontSize(size);
        doc.setTextColor(...color);
        doc.text(value, x, y, maxWidth ? { maxWidth } : undefined);
      };
      const panel = (x: number, y: number, w: number, h: number, fill: [number, number, number] = [255, 255, 255]) => {
        doc.setFillColor(...fill);
        doc.setDrawColor(...border);
        doc.setLineWidth(0.25);
        doc.roundedRect(x, y, w, h, 2, 2, "FD");
      };
      const header = (title: string, subtitle: string, page: number, total: number) => {
        doc.setFillColor(...teal);
        doc.rect(0, 0, pageW, 4, "F");
        write("WEEK SUPPORT  /  RAPPORT DE PERFORMANCE", margin, 13, 8, teal, true);
        write(title, margin, 24, 16, navy, true);
        write(subtitle, margin, 31, 8, muted, false, contentW - 48);
        panel(pageW - margin - 42, 10, 42, 15, [239, 248, 246]);
        write("PÉRIODE", pageW - margin - 38, 16, 6, muted, true);
        write(getPeriodLabel(selectedArchive), pageW - margin - 38, 21, 8, teal, true, 35);
        doc.setDrawColor(...border);
        doc.line(margin, 37, pageW - margin, 37);
        doc.setFontSize(7);
        doc.setTextColor(...muted);
        doc.text(`WEEK SUPPORT  •  ${getPeriodLabel(selectedArchive)}  •  Page ${page}/${total}`, margin, pageH - 7);
        doc.text(`Généré le ${new Date().toLocaleDateString("fr-FR")}`, pageW - margin, pageH - 7, { align: "right" });
      };
      const sectionTitle = (title: string, x: number, y: number) => write(title, x, y, 9, navy, true);
      const roundedLine = (x1: number, y1: number, x2: number, y2: number, color: [number, number, number], width = 0.5) => {
        doc.setDrawColor(...color);
        doc.setLineWidth(width);
        doc.line(x1, y1, x2, y2);
      };

      // PAGE 1 — Executive overview, KPI cards, vector charts and monthly details.
      header("Synthèse mensuelle", "Analyse de l'activité et des performances de l'équipe support", 1, 2);
      write(`Filtres appliqués : technicien ${filters.technician}  •  statut ${filters.status}`, margin, 43, 7, muted, false, contentW);

      const kpiY = 49;
      const kpiH = 28;
      const kpiGap = 3;
      const kpiW = (contentW - kpiGap * 3) / 4;
      const kpis = [
        { label: "Taux de réalisation", value: `${Math.round(currentStats.completionRate * 10) / 10}%`, note: comparison ? `${comparison.completionDifference >= 0 ? "+" : ""}${Math.round(comparison.completionDifference * 10) / 10} pts vs précédent` : "Comparaison non disponible", color: green },
        { label: "Tâches totales", value: String(currentStats.totalTasks), note: comparison ? `${comparison.taskDifference >= 0 ? "+" : ""}${comparison.taskDifference} vs précédent` : "Tâches de la période", color: blue },
        { label: "Temps moyen de traitement", value: `${Math.round(currentStats.averageCompletionTime * 10) / 10} jours`, note: "Sur les tâches terminées", color: violet },
        { label: "Tâches en retard", value: currentStats.delayedTasks === null ? "Non disponible" : String(currentStats.delayedTasks), note: previousStats?.delayedTasks !== null && previousStats?.delayedTasks !== undefined ? `${previousStats.delayedTasks} le mois précédent${overdueCarryoverCount ? ` • ${overdueCarryoverCount} toujours en retard` : ""}` : "Comparaison non disponible", color: orange },
      ];
      kpis.forEach((kpi, index) => {
        const x = margin + index * (kpiW + kpiGap);
        panel(x, kpiY, kpiW, kpiH);
        doc.setFillColor(...kpi.color);
        doc.roundedRect(x, kpiY, 1.5, kpiH, 0.6, 0.6, "F");
        write(kpi.label, x + 4, kpiY + 7, 7, muted, false, kpiW - 7);
        write(kpi.value, x + 4, kpiY + 16, kpi.value.length > 12 ? 10 : 13, navy, true, kpiW - 7);
        write(kpi.note, x + 4, kpiY + 23, 6, muted, false, kpiW - 7);
      });

      const chartY = 83;
      const chartH = 74;
      const chartGap = 4;
      const chartW = (contentW - chartGap) / 2;
      const chartPanel = (x: number, title: string, subtitle: string) => {
        panel(x, chartY, chartW, chartH);
        sectionTitle(title, x + 5, chartY + 9);
        write(subtitle, x + 5, chartY + 14, 6.3, muted);
      };
      chartPanel(margin, "Évolution du taux de réalisation", "Taux de tâches terminées par mois");
      chartPanel(margin + chartW + chartGap, "Volume de tâches par mois", "Nombre de tâches archivées");

      // Line chart: chart values are drawn as editable vector paths, not a screenshot.
      const plotX = margin + 13;
      const plotY = chartY + 22;
      const plotW = chartW - 19;
      const plotH = 38;
      [0, 25, 50, 75, 100].forEach((value) => {
        const y = plotY + plotH - (value / 100) * plotH;
        roundedLine(plotX, y, plotX + plotW, y, [233, 239, 242], 0.2);
        write(String(value), margin + 4, y + 1.5, 5.5, muted);
      });
      const points = monthlyChartData.map((point, index) => ({
        x: plotX + index * plotW / Math.max(monthlyChartData.length - 1, 1),
        y: plotY + plotH - Math.max(0, Math.min(100, point.completionRate)) / 100 * plotH,
        month: point.month,
      }));
      points.forEach((point, index) => {
        if (index > 0) roundedLine(points[index - 1].x, points[index - 1].y, point.x, point.y, blue, 0.8);
        doc.setFillColor(...blue);
        doc.circle(point.x, point.y, 0.8, "F");
        write(point.month, point.x - 2.2, plotY + plotH + 7, 5.2, muted);
      });

      // Bar chart: matching 12-month categories and teal palette.
      const barPanelX = margin + chartW + chartGap;
      const barX = barPanelX + 8;
      const barY = plotY;
      const barW = chartW - 13;
      const maxValue = Math.max(1, ...monthlyChartData.map((point) => point.totalTasks));
      [0, 0.5, 1].forEach((ratio) => roundedLine(barX, barY + plotH - ratio * plotH, barX + barW, barY + plotH - ratio * plotH, [233, 239, 242], 0.2));
      const slot = barW / Math.max(monthlyChartData.length, 1);
      monthlyChartData.forEach((point, index) => {
        const h = point.totalTasks / maxValue * plotH;
        const x = barX + index * slot + slot * 0.2;
        doc.setFillColor(...green);
        doc.roundedRect(x, barY + plotH - h, slot * 0.6, Math.max(h, 0.4), 0.7, 0.7, "F");
        write(point.month, x - 0.6, plotY + plotH + 7, 5.2, muted);
        if (point.totalTasks > 0) write(String(point.totalTasks), x + slot * 0.12, barY + plotH - h - 1.7, 5.5, navy, true);
      });

      // Five compact monthly indicators in a clean detail strip.
      const detailY = 165;
      panel(margin, detailY, contentW, 48);
      sectionTitle(`Détails de la période — ${getPeriodLabel(selectedArchive)}`, margin + 5, detailY + 9);
      const details = [
        ["Réalisation", `${Math.round(currentStats.completionRate * 10) / 10}%`],
        ["Tâches restantes", `${Math.round(currentStats.remainingTasksRate * 10) / 10}%`],
        ["Temps moyen", `${Math.round(currentStats.averageCompletionTime * 10) / 10} j`],
        ["Tâches totales", String(currentStats.totalTasks)],
        ["Réunions", String(currentStats.totalMeetings)],
      ];
      const detailGap = 2;
      const detailW = (contentW - 12 - detailGap * 4) / 5;
      details.forEach(([label, value], index) => {
        const x = margin + 5 + index * (detailW + detailGap);
        doc.setFillColor(...pale);
        doc.roundedRect(x, detailY + 15, detailW, 25, 1.5, 1.5, "F");
        write(label, x + 3, detailY + 22, 6.3, muted, false, detailW - 6);
        write(value, x + 3, detailY + 32, value.length > 10 ? 8 : 10, navy, true, detailW - 6);
      });
      write("Les graphiques sont tracés à partir des archives mensuelles disponibles.", margin, 224, 6.5, muted);

      // PAGE 2 — Technician table and most frequent task insight.
      const technicianPages = Math.max(1, Math.ceil(technicianStats.length / 20));
      const totalPages = 1 + technicianPages;
      doc.setPage(1);
      // Re-render page-one footer with accurate total count if the team requires continuation pages.
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(...muted);
      doc.text(`WEEK SUPPORT  •  ${getPeriodLabel(selectedArchive)}  •  Page 1/${totalPages}`, margin, pageH - 7);

      for (let pageIndex = 0; pageIndex < technicianPages; pageIndex += 1) {
        doc.addPage();
        const pageNo = pageIndex + 2;
        const pageTitle = pageIndex === 0 ? "Performance des techniciens" : "Performance des techniciens — suite";
        doc.setFillColor(...teal);
        doc.rect(0, 0, pageW, 4, "F");
        write("WEEK SUPPORT  /  RAPPORT DE PERFORMANCE", margin, 13, 8, teal, true);
        write(pageTitle, margin, 24, 16, navy, true);
        write("Répartition des tâches et tâche la plus récurrente", margin, 31, 8, muted);
        panel(pageW - margin - 42, 10, 42, 15, [239, 248, 246]);
        write("PÉRIODE", pageW - margin - 38, 16, 6, muted, true);
        write(getPeriodLabel(selectedArchive), pageW - margin - 38, 21, 8, teal, true, 35);
        doc.setDrawColor(...border);
        doc.line(margin, 37, pageW - margin, 37);

        let tableY = 47;
        if (pageIndex === 0) {
          panel(margin, 43, contentW, 42, [255, 255, 255]);
          doc.setFillColor(...teal);
          doc.roundedRect(margin, 43, 2, 42, 0.8, 0.8, "F");
          write("TÂCHE LA PLUS FRÉQUENTE DU MOIS", margin + 7, 52, 7, teal, true);
          if (mostFrequentTask) {
            write(mostFrequentTask.title, margin + 7, 63, 12, navy, true, 95);
            write("Tâche répétée le plus souvent parmi les éléments archivés de la période.", margin + 7, 71, 6.5, muted, false, 100);
            const measureX = margin + contentW - 72;
            doc.setDrawColor(...border);
            doc.line(measureX - 5, 49, measureX - 5, 78);
            write("OCCURRENCES", measureX, 55, 6, muted, true);
            write(String(mostFrequentTask.occurrences), measureX, 65, 12, teal, true);
            write("DURÉE MOYENNE", measureX + 31, 55, 6, muted, true);
            write(mostFrequentTask.averageDays === null ? "Non renseignée" : `${Math.round(mostFrequentTask.averageDays * 10) / 10} jours`, measureX + 31, 65, 8, violet, true, 36);
          } else {
            write("Aucune tâche ne correspond aux filtres sélectionnés.", margin + 7, 64, 9, muted);
          }
          tableY = 95;
        }
        sectionTitle("Répartition par technicien", margin, tableY);
        const headY = tableY + 9;
        const rowH = 8.2;
        doc.setFillColor(...pale);
        doc.roundedRect(margin, headY - 5, contentW, 9, 1, 1, "F");
        const xName = margin + 4;
        const xAssigned = margin + 93;
        const xCompleted = margin + 119;
        const xRate = margin + 143;
        const xProgress = margin + 158;
        write("TECHNICIEN", xName, headY + 1, 6.2, muted, true);
        write("ASSIGNÉES", xAssigned, headY + 1, 6.2, muted, true);
        write("TERMINÉES", xCompleted, headY + 1, 6.2, muted, true);
        write("TAUX", xRate, headY + 1, 6.2, muted, true);
        write("PROGRESSION", xProgress, headY + 1, 6.2, muted, true);
        const startIndex = pageIndex * 20;
        const rows = technicianStats.slice(startIndex, startIndex + 20);
        rows.forEach((item, index) => {
          const y = headY + 7 + index * rowH;
          if (index % 2 === 1) {
            doc.setFillColor(250, 252, 253);
            doc.rect(margin, y - 5.5, contentW, rowH, "F");
          }
          doc.setFillColor(...teal);
          doc.circle(xName + 2, y - 1.5, 2.3, "F");
          write(getInitials(item.name), xName + 0.2, y - 0.7, 4.5, [255, 255, 255], true, 4);
          write(item.name, xName + 7, y, 7, navy, false, 76);
          write(String(item.assigned), xAssigned + 5, y, 7, [51, 65, 85] as [number, number, number], false);
          write(String(item.completed), xCompleted + 5, y, 7, [51, 65, 85] as [number, number, number], false);
          write(`${Math.round(item.completionRate)}%`, xRate, y, 7, navy, true);
          doc.setFillColor(233, 239, 242);
          doc.roundedRect(xProgress, y - 3.2, 28, 2.6, 1, 1, "F");
          doc.setFillColor(...green);
          doc.roundedRect(xProgress, y - 3.2, 28 * Math.max(0, Math.min(100, item.completionRate)) / 100, 2.6, 1, 1, "F");
          doc.setDrawColor(...border);
          doc.line(margin, y + 2.6, pageW - margin, y + 2.6);
        });
        if (!technicianStats.length) write("Aucune tâche ne correspond aux filtres sélectionnés.", margin + 4, headY + 14, 8, muted);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.setTextColor(...muted);
        doc.text(`WEEK SUPPORT  •  ${getPeriodLabel(selectedArchive)}  •  Page ${pageNo}/${totalPages}`, margin, pageH - 7);
        doc.text(`Généré le ${new Date().toLocaleDateString("fr-FR")}`, pageW - margin, pageH - 7, { align: "right" });
      }

      doc.save(`rapport-historique-${selectedArchive.month}.pdf`);
    } finally {
      setIsExporting(false);
    }
  };
  if (user?.role?.toLowerCase() !== "admin") { 
    return ( 
      <div className="min-h-screen bg-slate-50 p-6"> 
        <div className="mx-auto max-w-xl rounded-2xl bg-white p-10 text-center shadow-sm"> 
          <h1 className="text-2xl font-bold text-red-600">Accès refusé</h1> 
          <p className="mt-3 text-sm text-slate-500">Seuls les administrateurs peuvent accéder à cette page.</p> 
          <Link href="/tasks" className="mt-5 inline-flex text-sm font-semibold text-emerald-700 hover:underline">← Retour aux tâches</Link> 
        </div> 
      </div> 
    ); 
  } 
 
  if (loading) { 
    return ( 
      <div className="min-h-screen bg-slate-50 p-6"> 
        <div className="mx-auto max-w-3xl rounded-2xl bg-white p-12 text-center shadow-sm"> 
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-emerald-100 border-t-emerald-600" /> 
          <p className="mt-4 text-sm text-slate-500">Chargement de l’historique…</p> 
        </div> 
      </div> 
    ); 
  } 
 
  if (error || archives.length === 0) { 
    return ( 
      <div className="min-h-screen bg-slate-50 p-6"> 
        <div className="mx-auto max-w-3xl"> 
          <h1 className="text-3xl font-bold text-slate-900">Historique &amp; Statistiques</h1> 
          <div className="mt-6"> 
            <EmptyState 
              title={error || "Aucune archive disponible"} 
              description={error || "Les archives mensuelles apparaîtront ici lorsque des données seront disponibles."} 
            /> 
          </div> 
        </div> 
      </div> 
    ); 
  } 
 
  const yearLabel = selectedYear || new Date().getFullYear(); 
 
  return (
    <main className="min-h-screen bg-[#f4f7f8] px-3 py-4 text-slate-800 sm:px-5 sm:py-5 lg:px-6">
      <div className="mx-auto w-full max-w-[1500px]">
        <header className="mb-3 flex flex-col gap-3 border-b border-slate-200 pb-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[#102b45]">Historique &amp; Statistiques</h1>
            <p className="mt-1 text-sm text-slate-500">Analyse de l&apos;activité et des performances de votre équipe.</p>
          </div>
          <div className="flex flex-wrap items-end gap-2.5">
            <label className="min-w-44">
              <span className="sr-only">Mois</span>
              <select
                value={selectedMonth || ""}
                onChange={(event) => {
                  const value = event.target.value;
                  setSelectedMonth(value);
                  setSelectedYear(Number(value.slice(0, 4)));
                }}
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
              >
                {monthOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={() => setViewMode((mode) => (mode === "monthly" ? "yearly" : "monthly"))}
              className="h-10 rounded-lg border border-teal-700 px-4 text-sm font-medium text-teal-800 transition hover:bg-teal-50"
            >
              {viewMode === "monthly" ? "Vue annuelle" : "Vue mensuelle"}
            </button>
            <button
              type="button"
              onClick={() => void exportPdf()}
              disabled={isExporting || !selectedArchive}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#087568] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#06685e] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <DownloadIcon />
              {isExporting ? "Export en cours…" : "Exporter PDF"}
            </button>
          </div>
        </header>

        {viewMode === "monthly" && selectedArchive && currentStats ? (
          <>
            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                title="Taux de réalisation"
                value={`${Math.round(currentStats.completionRate * 10) / 10}%`}
                detail="vs mois précédent"
                icon={<IconTrendUp className="h-5 w-5" />}
                tone="green"
                comparison={comparison?.completionDifference !== undefined ? `${comparison.completionDifference >= 0 ? "+" : ""}${Math.round(comparison.completionDifference * 10) / 10} pts` : undefined}
              />
              <StatCard
                title="Tâches totales"
                value={String(currentStats.totalTasks)}
                detail="vs mois précédent"
                icon={<IconClipboard className="h-5 w-5" />}
                tone="blue"
                comparison={comparison?.taskDifference !== undefined ? `${comparison.taskDifference >= 0 ? "+" : ""}${comparison.taskDifference}` : undefined}
              />
              <StatCard
                title="Temps moyen de traitement"
                value={`${Math.round(currentStats.averageCompletionTime * 10) / 10} jours`}
                detail="sur les tâches terminées"
                icon={<IconClock className="h-5 w-5" />}
                tone="violet"
                comparison={comparison && comparison.timeDifference !== null ? `${comparison.timeDifference >= 0 ? "+" : ""}${Math.round(comparison.timeDifference * 10) / 10} jours` : undefined}
              />
              <StatCard
                title="Tâches en retard"
                value={currentStats.delayedTasks === null ? "—" : String(currentStats.delayedTasks)}
                detail={previousStats?.delayedTasks !== null && previousStats?.delayedTasks !== undefined
                  ? `vs ${previousStats.delayedTasks} le mois précédent`
                  : currentStats.delayedTasks === null ? "Donnée absente de l’archive" : "Comparaison indisponible"}
                icon={<IconClock className="h-5 w-5" />}
                tone="orange"
                superscript={overdueCarryoverCount ? `−${overdueCarryoverCount}` : undefined}
              />
            </section>

            <section className="mt-3 grid gap-3 xl:grid-cols-2">
              <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-[#123657]"><IconTrendUp className="h-5 w-5 text-teal-700" />Évolution du taux de réalisation</h2>
                <div className="h-40 w-full sm:h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyChartData} margin={{ top: 12, right: 10, left: -18, bottom: 0 }}>
                      <CartesianGrid stroke="#e8edf1" vertical strokeDasharray="2 3" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 11 }} />
                      <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 10 }} unit="%" />
                      <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0" }} formatter={(value) => [`${value ?? 0}%`, "Taux de réalisation"]} />
                      <Line type="monotone" dataKey="completionRate" stroke="#2876d2" strokeWidth={2.5} dot={{ r: 3, fill: "#2876d2" }} activeDot={{ r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </article>

              <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-[#123657]"><IconClipboard className="h-5 w-5 text-teal-700" />Volume de tâches par mois</h2>
                <div className="h-40 w-full sm:h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyChartData} margin={{ top: 12, right: 10, left: -18, bottom: 0 }}>
                      <CartesianGrid stroke="#e8edf1" vertical={false} />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 11 }} />
                      <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 10 }} />
                      <Tooltip cursor={{ fill: "#f5f8f9" }} contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0" }} />
                      <Bar dataKey="totalTasks" fill="#109982" radius={[3, 3, 0, 0]} maxBarSize={48} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </article>
            </section>

            <section className="mt-3 grid gap-3 xl:grid-cols-[0.95fr_1.05fr]">
              <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-[#123657]"><IconCalendar className="h-5 w-5 text-teal-700" />Détails — {getPeriodLabel(selectedArchive)}</h2>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-2 2xl:grid-cols-3">
                  <DetailCard label="Taux de réalisation" value={`${Math.round(currentStats.completionRate * 10) / 10}%`} detail="tâches terminées" color="green" />
                  <DetailCard label="Tâches restantes" value={`${Math.round(currentStats.remainingTasksRate * 10) / 10}%`} detail="non terminées" color="blue" />
                  <DetailCard label="Temps moyen" value={`${Math.round(currentStats.averageCompletionTime * 10) / 10} jours`} detail="de traitement" color="violet" />
                  <DetailCard label="Tâches totales" value={String(currentStats.totalTasks)} detail="dans la période" color="blue" />
                  <DetailCard label="Réunions" value={String(currentStats.totalMeetings)} detail="archivées ce mois" color="green" />
                </div>
              </article>

              <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <h2 className="flex items-center gap-2 text-base font-bold text-[#123657]"><IconClipboard className="h-5 w-5 text-teal-700" />Répartition par technicien</h2>
                  <label className="flex items-center gap-2 text-xs text-slate-500">
                    <span>Technicien</span>
                    <select
                      value={filters.technician}
                      onChange={(event) => setFilters((current) => ({ ...current, technician: event.target.value }))}
                      className="h-9 min-w-36 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                    >
                      <option value="Tous">Tous</option>
                      {technicians.map((technician) => <option key={technician} value={technician}>{technician}</option>)}
                    </select>
                  </label>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[520px] text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600">
                      <tr>
                        <th className="px-3 py-2.5 font-semibold">Technicien</th>
                        <th className="px-3 py-2.5 text-center font-semibold">Tâches assignées</th>
                        <th className="px-3 py-2.5 text-center font-semibold">Terminées</th>
                        <th className="px-3 py-2.5 font-semibold">Taux de réalisation</th>
                      </tr>
                    </thead>
                    <tbody>
                      {technicianStats.map((item) => (
                        <tr key={item.name} className="border-t border-slate-100 text-slate-700">
                          <td className="px-3 py-2.5"><span className="mr-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-teal-100 text-[10px] font-bold text-teal-800">{getInitials(item.name)}</span>{item.name}</td>
                          <td className="px-3 py-2.5 text-center">{item.assigned}</td>
                          <td className="px-3 py-2.5 text-center">{item.completed}</td>
                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-2">
                              <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-teal-600" style={{ width: `${Math.max(0, Math.min(100, item.completionRate))}%` }} /></div>
                              <span className="w-9 text-right font-medium">{Math.round(item.completionRate)}%</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {!technicianStats.length && <tr><td colSpan={4} className="px-3 py-8 text-center text-slate-400">Aucune tâche ne correspond aux filtres sélectionnés.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </article>
            </section>

            <section className="mt-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="mb-3 flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-50 text-teal-700"><IconClipboard className="h-4 w-4" /></span>
                <div>
                  <h2 className="text-base font-bold text-[#123657]">Tâche la plus fréquente du mois</h2>
                  <p className="text-xs text-slate-500">Récurrence et durée moyenne, selon les filtres sélectionnés.</p>
                </div>
              </div>
              {mostFrequentTask ? (
                <div className="grid gap-3 rounded-lg bg-slate-50 p-3 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center">
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Type de tâche le plus récurrent</p>
                    <p className="mt-1 truncate text-lg font-semibold text-[#123657]">{mostFrequentTask.title}</p>
                  </div>
                  <div className="rounded-lg bg-white px-4 py-2 text-center shadow-sm">
                    <p className="text-[11px] text-slate-500">Occurrences</p>
                    <p className="text-lg font-bold text-teal-700">{mostFrequentTask.occurrences}</p>
                  </div>
                  <div className="rounded-lg bg-white px-4 py-2 text-center shadow-sm">
                    <p className="text-[11px] text-slate-500">Durée moyenne</p>
                    <p className="text-lg font-bold text-violet-700">{mostFrequentTask.averageDays === null ? "Non renseignée" : `${Math.round(mostFrequentTask.averageDays * 10) / 10} jours`}</p>
                  </div>
                </div>
              ) : (
                <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">Aucune tâche ne correspond aux filtres sélectionnés.</p>
              )}
            </section>
          </>
        ) : viewMode === "yearly" ? (
          <section className="mt-4">
            <div className="mb-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-bold text-[#123657]">Statistiques annuelles — {yearLabel}</h2>
              <p className="mt-1 text-sm text-slate-500">Agrégation des données de toutes les archives de l&apos;année sélectionnée.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <AnnualStat label="Tâches totales" value={String(monthlyDetails.reduce((sum, item) => sum + item.stats.totalTasks, 0))} color="blue" />
              <AnnualStat label="Taux de réalisation" value={`${Math.round((monthlyDetails.reduce((sum, item) => sum + item.stats.completionRate, 0) / Math.max(monthlyDetails.length, 1)) * 10) / 10}%`} color="green" />
              <AnnualStat label="Temps moyen" value={`${Math.round((monthlyDetails.reduce((sum, item) => sum + item.stats.averageCompletionTime, 0) / Math.max(monthlyDetails.length, 1)) * 10) / 10} jours`} color="violet" />
              <AnnualStat label="Réunions" value={String(monthlyDetails.reduce((sum, item) => sum + item.stats.totalMeetings, 0))} color="orange" />
            </div>
            <div className="mt-3 grid gap-3 xl:grid-cols-2">
              <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-base font-bold text-[#123657]">Évolution du taux de réalisation</h2>
                <div className="mt-3 h-52"><ResponsiveContainer width="100%" height="100%"><LineChart data={monthlyChartData}><CartesianGrid stroke="#e8edf1" vertical strokeDasharray="2 3" /><XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 11 }} /><YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 10 }} unit="%" /><Tooltip formatter={(value) => [`${value ?? 0}%`, "Taux"]} /><Line type="monotone" dataKey="completionRate" stroke="#2876d2" strokeWidth={2.5} /></LineChart></ResponsiveContainer></div>
              </article>
              <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-base font-bold text-[#123657]">Volume de tâches par mois</h2>
                <div className="mt-3 h-52"><ResponsiveContainer width="100%" height="100%"><BarChart data={monthlyChartData}><CartesianGrid stroke="#e8edf1" vertical={false} /><XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 11 }} /><YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 10 }} /><Tooltip /><Bar dataKey="totalTasks" fill="#109982" radius={[3, 3, 0, 0]} maxBarSize={48} /></BarChart></ResponsiveContainer></div>
              </article>
            </div>
          </section>
        ) : (
          <section className="mt-4">
            <EmptyState
              title={`Aucune archive pour ${monthOptions.find((option) => option.value === selectedMonth)?.label || selectedMonth || "ce mois"}`}
              description="Le mois reste disponible dans le sélecteur. Ses statistiques apparaîtront dès que son archive sera créée."
            />
          </section>
        )}
      </div>
    </main>
  );
} 
 
function DetailCard({ label, value, detail, color }: { label: string; value: string; detail: string; color: "green" | "orange" | "violet" | "blue" }) { 
  const styles = { 
    green: "bg-emerald-50 text-emerald-700", 
    orange: "bg-orange-50 text-orange-700", 
    violet: "bg-violet-50 text-violet-700", 
    blue: "bg-sky-50 text-sky-700", 
  }; 
  return ( 
    <article className="rounded-lg border border-slate-100 bg-slate-50/70 p-3"> 
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p> 
      <p className={`mt-3 text-2xl font-bold ${styles[color]}`}>{value}</p> 
      <p className="mt-2 text-xs text-slate-500">{detail}</p> 
    </article> 
  ); 
} 
 
function AnnualStat({ label, value, color }: { label: string; value: string; color: "green" | "blue" | "violet" | "orange" }) { 
  const styles = { 
    green: "bg-emerald-50 text-emerald-700", 
    blue: "bg-sky-50 text-sky-700", 
    violet: "bg-violet-50 text-violet-700", 
    orange: "bg-orange-50 text-orange-700", 
  }; 
  return ( 
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"> 
      <p className="text-sm font-medium text-slate-500">{label}</p> 
      <p className={`mt-3 text-3xl font-bold ${styles[color]}`}>{value}</p> 
    </article> 
  ); 
}
