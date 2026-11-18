"use client";

import { useState } from "react";
import { 
  getHistoryArchives, 
  saveArchive, 
  calculateStats,
  MonthlyArchive 
} from "@/lib/historyStorage";
import { seedDemoData } from "@/lib/demoData";

/**
 * Composant de test pour vérifier le système d'archivage
 * Usage: Ajouter à votre dashboard pour tester
 * 
 * Exemple:
 * <ArchiveTestComponent />
 */
export default function ArchiveTestComponent() {
  const [archives, setArchives] = useState<MonthlyArchive[]>([]);
  const [message, setMessage] = useState("");

  const handleLoadArchives = () => {
    const data = getHistoryArchives();
    setArchives(data);
    setMessage(`✅ ${data.length} archives trouvées en localStorage`);
  };

  const handleLoadDemoData = () => {
    seedDemoData();
    setMessage(
      "✅ Données de démonstration chargées ! Rechargez /history"
    );
    setTimeout(() => handleLoadArchives(), 500);
  };

  const handleClearData = () => {
    localStorage.removeItem("history_archives");
    setArchives([]);
    setMessage("🗑️ Toutes les archives ont été supprimées");
  };

  const handleCreateTestArchive = () => {
    const testArchive: MonthlyArchive = {
      month: "2025-02",
      year: 2025,
      monthNumber: 2,
      tasks: [
        {
          id: "test-1",
          title: "Test Task 1",
          status: "completed",
          assignedTo: "Test User",
          createdDate: "2025-02-01",
          completedDate: "2025-02-05",
          daysToComplete: 4,
        },
        {
          id: "test-2",
          title: "Test Task 2",
          status: "pending",
          assignedTo: "Test User",
          createdDate: "2025-02-10",
        },
      ],
      meetings: [
        {
          id: "test-m1",
          title: "Test Meeting",
          date: "2025-02-15",
          duration: 60,
          participants: ["Test User"],
        },
      ],
      createdAt: new Date().toISOString(),
      stats: {
        completionRate: 50,
        averageCompletionTime: 4,
        totalTasks: 2,
        completedTasks: 1,
        pendingTasks: 1,
        inProgressTasks: 0,
        totalMeetings: 1,
        meetingCompletionRate: 100,
        totalMeetingHours: 1,
      },
    };

    saveArchive(testArchive);
    setMessage("✅ Archive de test créée !");
    setTimeout(() => handleLoadArchives(), 500);
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-6 border-2 border-blue-200">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        🧪 Test Archive System
      </h2>

      {/* Messages */}
      {message && (
        <div className="mb-4 p-3 bg-blue-100 text-blue-800 rounded-lg">
          {message}
        </div>
      )}

      {/* Boutons d'action */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <button
          onClick={handleLoadArchives}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition"
        >
          📂 Charger Archives
        </button>

        <button
          onClick={handleCreateTestArchive}
          className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition"
        >
          ✨ Créer Test
        </button>

        <button
          onClick={handleLoadDemoData}
          className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition"
        >
          📊 Données Demo
        </button>

        <button
          onClick={handleClearData}
          className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition"
        >
          🗑️ Effacer Tout
        </button>
      </div>

      {/* Affichage des archives */}
      {archives.length > 0 && (
        <div className="bg-white rounded-lg p-4">
          <h3 className="font-semibold text-lg mb-3">
            📋 {archives.length} Archive(s) trouvée(s)
          </h3>

          <div className="space-y-3">
            {archives.map((archive) => (
              <div key={archive.month} className="border-l-4 border-blue-500 pl-4">
                <p className="font-semibold text-blue-700">
                  {archive.month} ({archive.year})
                </p>
                <div className="text-sm text-gray-600 grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                  <div>
                    <span className="font-semibold">Tâches:</span> {archive.stats?.totalTasks}
                  </div>
                  <div>
                    <span className="font-semibold">Taux:</span>{" "}
                    {archive.stats?.completionRate}%
                  </div>
                  <div>
                    <span className="font-semibold">Temps moyen:</span>{" "}
                    {archive.stats?.averageCompletionTime}j
                  </div>
                  <div>
                    <span className="font-semibold">Réunions:</span>{" "}
                    {archive.stats?.totalMeetings}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Bouton pour voir sur /history */}
          <a
            href="/history"
            className="inline-block mt-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-2 px-6 rounded-lg transition"
          >
            👉 Voir sur /history →
          </a>
        </div>
      )}

      {archives.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
          <p className="text-yellow-800">
            ⚠️ Aucune archive trouvée. Cliquez sur "Créer Test" ou "Données Demo"
          </p>
        </div>
      )}

      {/* Info */}
      <div className="mt-6 bg-white rounded-lg p-4 text-sm text-gray-600">
        <p className="font-semibold mb-2">💡 Conseil</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Les données sont stockées dans localStorage du navigateur</li>
          <li>Ouvrez DevTools (F12) → Application → Storage pour voir les données</li>
          <li>Visitez /history pour voir les graphiques et statistiques</li>
          <li>Attendez le 29 du mois (ou modifiez useMonthlyArchive.ts) pour archivage auto</li>
        </ul>
      </div>
    </div>
  );
}
