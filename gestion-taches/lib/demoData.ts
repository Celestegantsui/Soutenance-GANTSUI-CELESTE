/**
 * Service pour générer des données de démonstration
 * pour tester l'historique et les statistiques
 */

import {
  MonthlyArchive,
  calculateStats,
  saveArchive,
} from "@/lib/historyStorage";

const TECHNICIENS = [
  "Céleste",
  "Junior",
  "Pierre",
  "Dylan",
  "Alain",
  "Sophie",
  "Marc",
  "Nathalie",
];

function generateRandomDate(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split("T")[0];
}

function getRandomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function generateDemoArchives() {
  // Générer 6 mois de données précédentes
  const archives: MonthlyArchive[] = [];
  const today = new Date();

  for (let monthsBack = 1; monthsBack <= 6; monthsBack++) {
    const archiveDate = new Date(today);
    archiveDate.setMonth(archiveDate.getMonth() - monthsBack);

    const monthNumber = archiveDate.getMonth() + 1;
    const year = archiveDate.getFullYear();
    const monthKey = `${year}-${String(monthNumber).padStart(2, "0")}`;

    // Générer 15-25 tâches par mois
    const taskCount = getRandomInt(15, 25);
    const tasks = [];

    for (let i = 0; i < taskCount; i++) {
      const isCompleted = Math.random() > 0.3; // 70% de chance d'être complétée
      const isInProgress = !isCompleted && Math.random() > 0.5; // 50% des tâches non complétées sont en cours
      const status = isCompleted ? "completed" : isInProgress ? "in-progress" : "pending";
      const daysToComplete = isCompleted ? getRandomInt(1, 15) : undefined;
      const completedDate = isCompleted
        ? generateRandomDate(monthsBack * 30 - getRandomInt(1, 28))
        : undefined;

      tasks.push({
        id: `task-${monthKey}-${i}`,
        title: [
          "Installer un poste",
          "Configurer VPN",
          "Réparer switch",
          "Installation imprimante",
          "Maintenance serveur",
          "Backup données",
          "Support utilisateur",
          "Installation logiciel",
          "Ticket réseau",
          "Configuration WiFi",
        ][getRandomInt(0, 9)],
        status: status as "completed" | "pending" | "in-progress",
        assignedTo: getRandomElement(TECHNICIENS),
        createdDate: generateRandomDate(monthsBack * 30 + getRandomInt(1, 28)),
        completedDate,
        daysToComplete,
      });
    }

    // Générer 3-8 réunions par mois
    const meetingCount = getRandomInt(3, 8);
    const meetings = [];

    for (let i = 0; i < meetingCount; i++) {
      meetings.push({
        id: `meeting-${monthKey}-${i}`,
        title: [
          "Réunion d'équipe",
          "Point technique",
          "Planification sprintée",
          "Revue de sprint",
          "Support client",
          "Maintenance planifiée",
        ][getRandomInt(0, 5)],
        date: generateRandomDate(monthsBack * 30 + getRandomInt(1, 28)),
        duration: getRandomInt(30, 120),
        participants: [
          getRandomElement(TECHNICIENS),
          getRandomElement(TECHNICIENS),
          getRandomElement(TECHNICIENS),
        ],
      });
    }

    const stats = calculateStats(tasks, meetings);

    archives.push({
      month: monthKey,
      year,
      monthNumber,
      tasks,
      meetings,
      createdAt: new Date().toISOString(),
      stats,
    });
  }

  return archives;
}

export function seedDemoData() {
  const archives = generateDemoArchives();
  archives.forEach((archive) => saveArchive(archive));
}
