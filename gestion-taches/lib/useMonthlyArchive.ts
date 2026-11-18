import { useEffect } from "react";
import {
  getHistoryArchives,
  saveArchive,
  getCurrentMonthKey,
  calculateStats,
  MonthlyArchive,
} from "@/lib/historyStorage";

/**
 * Hook pour archiver automatiquement les tâches à la fin du mois
 * À utiliser dans le composant principal des tâches
 */
export function useMonthlyArchive(
  tasks: any[],
  meetings: any[],
  onArchiveComplete?: (archive: MonthlyArchive) => void
) {
  useEffect(() => {
    const checkAndArchive = () => {
      const now = new Date();
      const currentMonth = getCurrentMonthKey();
      const archives = getHistoryArchives();

      // Vérifier si le mois actuel est déjà archivé
      const alreadyArchived = archives.some((a) => a.month === currentMonth);

      // Archiver si c'est la fin du mois (29e, 30e ou 31e jour) et pas encore archivé
      if (
        (now.getDate() >= 29 || now.getMonth() === 1) && // Les 29-31 ou dernier jour de février
        !alreadyArchived &&
        (tasks.length > 0 || meetings.length > 0)
      ) {
        const stats = calculateStats(tasks, meetings);

        const archive: MonthlyArchive = {
          month: currentMonth,
          year: now.getFullYear(),
          monthNumber: now.getMonth() + 1,
          tasks: tasks.map((t) => ({
            id: t.id,
            title: t.title,
            status: t.status,
            assignedTo: t.assignedTo,
            createdDate: t.createdDate,
            completedDate: t.completedDate,
            daysToComplete: t.daysToComplete,
          })),
          meetings: meetings.map((m) => ({
            id: m.id,
            title: m.title,
            date: m.date,
            duration: m.duration,
            participants: m.participants,
            notes: m.notes,
          })),
          createdAt: new Date().toISOString(),
          stats,
        };

        saveArchive(archive);
        onArchiveComplete?.(archive);
      }
    };

    // Vérifier chaque heure
    const interval = setInterval(checkAndArchive, 3600000);
    checkAndArchive(); // Vérifier une première fois

    return () => clearInterval(interval);
  }, [tasks, meetings, onArchiveComplete]);
}

/**
 * Hook pour récupérer les données du mois en cours ou archivées
 */
export function useMonthlyData(monthKey?: string) {
  const archives = getHistoryArchives();
  const targetMonth = monthKey || getCurrentMonthKey();

  return archives.find((a) => a.month === targetMonth);
}
