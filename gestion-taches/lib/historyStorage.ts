// Gestion du stockage historique - connecté à l'API Laravel

import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface MonthlyTask {
  id: string;
  title: string;
  status: string;
  assignedTo: string;
  createdDate: string;
  created_date?: string;
  startDate?: string;
  start_date?: string;
  endDate?: string;
  end_date?: string;
  completedDate?: string;
  completed_date?: string;
  daysToComplete?: number;
}

export interface MonthlyMeeting {
  id: string;
  title: string;
  date: string;
  duration: number;
  participants: string[];
  notes?: string;
}

export interface MonthlyArchive {
  month: string; // "2024-12", "2025-01", etc.
  year: number;
  monthNumber: number;
  tasks: MonthlyTask[];
  meetings: MonthlyMeeting[];
  createdAt: string;
  stats?: {
    completionRate: number;
    remainingTasksRate?: number;
    averageCompletionTime: number;
    delayedTasks?: number;
    overdueTasksCount?: number;
    overdue_tasks_count?: number;
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    inProgressTasks: number;
    totalMeetings: number;
    meetingCompletionRate: number;
    totalMeetingHours: number;
  };
  overdueTasksCount?: number;
  overdue_tasks_count?: number;
}

/**
 * Récupère les archives mensuelles depuis l'API Laravel
 */
export async function getHistoryArchivesFromAPI(): Promise<MonthlyArchive[]> {
  try {
    const token = localStorage.getItem("token");
    const response = await axios.get(`${API_URL}/api/history/monthly`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Erreur récupération historique:", error);
    return [];
  }
}

/**
 * Fallback: lecture depuis localStorage (compatibilité ancienne version)
 */
export function getHistoryArchives(): MonthlyArchive[] {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem("history_archives");
  return data ? JSON.parse(data) : [];
}

export function saveArchive(archive: MonthlyArchive): void {
  if (typeof window === "undefined") return;
  const archives = getHistoryArchives();
  const existingIndex = archives.findIndex((a) => a.month === archive.month);
  if (existingIndex >= 0) {
    archives[existingIndex] = archive;
  } else {
    archives.push(archive);
  }
  localStorage.setItem("history_archives", JSON.stringify(archives));
}

export function calculateStats(tasks: MonthlyTask[], meetings: MonthlyMeeting[]) {
  const completedTasks = tasks.filter((t) => t.status === "completed");
  const completionRate =
    tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0;

  const completionTimes = completedTasks
    .filter((t) => t.daysToComplete !== undefined)
    .map((t) => t.daysToComplete as number);

  const averageCompletionTime =
    completionTimes.length > 0
      ? completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length
      : 0;

  const totalMeetingMinutes = meetings.reduce((sum, m) => sum + m.duration, 0);
  const meetingCompletionRate = meetings.length > 0 ? 100 : 0;

  return {
    completionRate: Math.round(completionRate * 100) / 100,
    averageCompletionTime: Math.round(averageCompletionTime * 100) / 100,
    totalTasks: tasks.length,
    completedTasks: completedTasks.length,
    pendingTasks: tasks.filter((t) => t.status === "pending").length,
    inProgressTasks: tasks.filter((t) => t.status === "in-progress").length,
    totalMeetings: meetings.length,
    meetingCompletionRate,
    totalMeetingHours: Math.round((totalMeetingMinutes / 60) * 100) / 100,
  };
}

export function getCurrentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function getMonthFromKey(key: string): { year: number; month: number } {
  const [year, month] = key.split("-").map(Number);
  return { year, month };
}