/**
 * EXEMPLE D'INTÉGRATION DU SYSTÈME D'ARCHIVAGE
 * À ajouter à votre page `app/tasks/page.tsx` ou `app/dashboard/page.tsx`
 */

"use client";

import { useState, useEffect } from "react";
import { useMonthlyArchive } from "@/lib/useMonthlyArchive";
import { MonthlyArchive } from "@/lib/historyStorage";

// Type pour vos tâches
interface Task {
  id: string;
  title: string;
  status: "completed" | "pending" | "in-progress";
  assignedTo: string;
  createdDate: string;
  completedDate?: string;
  daysToComplete?: number;
}

interface Meeting {
  id: string;
  title: string;
  date: string;
  duration: number;
  participants: string[];
  notes?: string;
}

export default function TasksPageExample() {
  const [tasks, setTasks] = useState<Task[]>([
    // Exemple de données
    {
      id: "1",
      title: "Installer un poste",
      status: "completed",
      assignedTo: "Céleste",
      createdDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      completedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      daysToComplete: 4,
    },
    {
      id: "2",
      title: "Configurer VPN",
      status: "in-progress",
      assignedTo: "Junior",
      createdDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
    },
  ]);

  const [meetings, setMeetings] = useState<Meeting[]>([
    {
      id: "m1",
      title: "Réunion d'équipe",
      date: new Date().toISOString().split("T")[0],
      duration: 60,
      participants: ["Céleste", "Junior", "Pierre"],
    },
  ]);

  const [lastArchived, setLastArchived] = useState<MonthlyArchive | null>(null);

  // ✅ INTEGRER LE HOOK D'ARCHIVAGE AUTOMATIQUE
  useMonthlyArchive(tasks, meetings, (archive) => {
    setLastArchived(archive);
    console.log(`✅ Archive créée pour ${archive.month}:`, archive.stats);

    // OPTIONNEL : Envoyer l'archive au backend
    // fetch("/api/archives", {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify(archive),
    // });
  });

  const handleCompleteTask = (taskId: string) => {
    setTasks(
      tasks.map((task) => {
        if (task.id === taskId) {
          const completedDate = new Date().toISOString().split("T")[0];
          const createdDate = new Date(task.createdDate);
          const completedDateObj = new Date(completedDate);
          const daysToComplete = Math.ceil(
            (completedDateObj.getTime() - createdDate.getTime()) /
              (1000 * 60 * 60 * 24)
          );

          return {
            ...task,
            status: "completed",
            completedDate,
            daysToComplete,
          };
        }
        return task;
      })
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">WEEK Support</h1>

        {/* Indicateur d'archivage */}
        {lastArchived && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-green-800 font-semibold">
              ✅ Archive du mois {lastArchived.month} créée !
            </p>
            <p className="text-sm text-green-700 mt-1">
              Tâches archivées: {lastArchived.stats?.totalTasks} | Taux réussite:{" "}
              {lastArchived.stats?.completionRate}%
            </p>
          </div>
        )}

        {/* Tableau des tâches */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="px-6 py-3 text-left font-semibold">Titre</th>
                <th className="px-6 py-3 text-left font-semibold">Assigné</th>
                <th className="px-6 py-3 text-left font-semibold">Statut</th>
                <th className="px-6 py-3 text-right font-semibold">Jours</th>
                <th className="px-6 py-3 text-center font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-3">{task.title}</td>
                  <td className="px-6 py-3">{task.assignedTo}</td>
                  <td className="px-6 py-3">
                    <span
                      className={`px-3 py-1 rounded text-sm font-medium ${
                        task.status === "completed"
                          ? "bg-green-100 text-green-800"
                          : task.status === "in-progress"
                          ? "bg-orange-100 text-orange-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {task.status}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right">
                    {task.daysToComplete || "-"}
                  </td>
                  <td className="px-6 py-3 text-center">
                    {task.status !== "completed" && (
                      <button
                        onClick={() => handleCompleteTask(task.id)}
                        className="text-blue-600 hover:text-blue-800 font-semibold"
                      >
                        Complétée
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Statistiques actuelles */}
        <div className="mt-8 grid grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Total tâches</p>
            <p className="text-2xl font-bold">{tasks.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Complétées</p>
            <p className="text-2xl font-bold text-green-600">
              {tasks.filter((t) => t.status === "completed").length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Réunions ce mois</p>
            <p className="text-2xl font-bold">{meetings.length}</p>
          </div>
        </div>

        {/* Conseil d'intégration */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800 font-semibold">💡 Comment intégrer</p>
          <ol className="text-sm text-blue-700 mt-2 space-y-1 list-decimal list-inside">
            <li>Importez le hook: <code>useMonthlyArchive</code></li>
            <li>Passez vos tâches et réunions au hook</li>
            <li>Les données s'archiveront automatiquement en fin de mois</li>
            <li>Visualisez les historiques sur <code>/history</code></li>
          </ol>
        </div>
      </div>
    </div>
  );
}
