/**
 * FLUX DE DONNÉES - SYSTÈME D'HISTORIQUE
 * 
 * Ce fichier montre comment les données circulent dans le système
 */

// ================================
// 1️⃣  COLLECTE DES DONNÉES (Pages de tâches)
// ================================

/*
Tasks Page / Dashboard
  │
  ├─ Crée/Modifie des tâches
  │  {
  │    id: "123",
  │    title: "Installer poste",
  │    status: "completed",
  │    assignedTo: "Céleste",
  │    createdDate: "2025-02-20",
  │    completedDate: "2025-02-23",
  │    daysToComplete: 3
  │  }
  │
  └─ Crée/Modifie des réunions
     {
       id: "m1",
       title: "Réunion équipe",
       date: "2025-02-20",
       duration: 60,
       participants: ["Céleste", "Junior"]
     }

// ================================
// 2️⃣  ARCHIVAGE AUTOMATIQUE
// ================================

App.tsx / Layout.tsx
  │
  └─ useMonthlyArchive(tasks, meetings)
     │
     ├─ Chaque heure, vérifie:
     │  "Est-on après le 29 du mois?"
     │
     ├─ Si OUI:
     │  ├─ Collecte toutes les tâches & réunions
     │  ├─ Calcule les statistiques
     │  │  - Taux réussite
     │  │  - Temps moyen d'exécution
     │  │  - Volume
     │  │  - Durée réunions
     │  │
     │  └─ Crée une archive:
     │     {
     │       month: "2025-02",
     │       year: 2025,
     │       monthNumber: 2,
     │       tasks: [...],
     │       meetings: [...],
     │       stats: { ... }
     │     }
     │
     ├─ Sauvegarde avec saveArchive()
     │  ├─ localStorage (frontend)
     │  └─ POST /api/archives (backend)
     │
     └─ Les tâches du mois actuel restent visibles
        Les tâches du mois précédent sont archivées

// ================================
// 3️⃣  STOCKAGE DES ARCHIVES
// ================================

historyStorage.ts
  │
  ├─ localStorage["history_archives"]
  │  └─ JSON array de 6+ archives
  │
  └─ Backend: /api/archives
     └─ Stocke aussi (pour persistence)

// ================================
// 4️⃣  AFFICHAGE STATISTIQUES
// ================================

History Page (/history)
  │
  ├─ getHistoryArchives()
  │  └─ Récupère depuis localStorage
  │
  ├─ Affiche sélecteur de mois
  │
  ├─ Dessine 4 graphiques Recharts:
  │  ├─ Courbe taux réussite
  │  ├─ Courbe vitesse d'exécution
  │  ├─ Barres volume tâches
  │  └─ Barres nombre réunions
  │
  └─ Affiche tableaux détaillés:
     ├─ Tâches avec daysToComplete
     └─ Réunions avec durée

// ================================
// 5️⃣  UTILISATEUR FINAL
// ================================

Utilisateur
  │
  ├─ Utilise l'app normalement
  │  └─ Crée/complète des tâches
  │
  ├─ Fin du mois (29+):
  │  └─ Archivage automatique en arrière-plan
  │
  └─ Visite /history
     └─ Voit courbes & stats des mois précédents
        ├─ Peut comparer ses performances
        ├─ Voit l'évolution du taux de réussite
        ├─ Analyse la vitesse d'exécution
        └─ Vérifie la charge de réunions

// ================================
// TRANSFERT DE DONNÉES
// ================================

        Tasks State
            ↓
      useMonthlyArchive()
            ↓
    Vérifie fin de mois
            ↓
       calculateStats()
            ↓
      Crée Archive
            ↓
        Sauvegarde
       ↙         ↘
   localStorage   API Backend
       ↓             ↓
   Stockage        Stockage
     Local         Cloud
       ↓             ↓
   History Page <----+
       ↓
  Affiche Recharts
       ↓
  Utilisateur voit
  les statistiques

// ================================
// EXEMPLE CONCRET DE DONNÉES
// ================================

// JANVIER 2025 - Archive
{
  month: "2025-01",
  year: 2025,
  monthNumber: 1,
  
  tasks: [
    { id: "t1", title: "Tâche 1", status: "completed", daysToComplete: 3 },
    { id: "t2", title: "Tâche 2", status: "completed", daysToComplete: 5 },
    { id: "t3", title: "Tâche 3", status: "pending", daysToComplete: undefined },
  ],
  
  meetings: [
    { id: "m1", title: "Réunion 1", duration: 60 },
    { id: "m2", title: "Réunion 2", duration: 45 },
  ],
  
  stats: {
    completionRate: 66.67,      // 2/3 tâches complétées
    averageCompletionTime: 4,   // (3+5)/2
    totalTasks: 3,
    completedTasks: 2,
    pendingTasks: 1,
    totalMeetings: 2,
    totalMeetingHours: 1.75     // 105 minutes
  }
}

// Cet enregistrement s'affiche alors sur /history
// en tant que courbe et statistiques

// ================================
// INTÉGRATION DANS VOTRE CODE
// ================================

// app/tasks/page.tsx OU app/dashboard/page.tsx

import { useMonthlyArchive } from "@/lib/useMonthlyArchive";

export default function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);

  // ✅ JUSTE CETTE LIGNE !
  useMonthlyArchive(tasks, meetings);

  // Votre interface existante continue ici...
}

// ================================
// VÉRIFICATION DU FONCTIONNEMENT
// ================================

// Dans la console du navigateur, appelez:
localStorage.getItem("history_archives")
// Doit retourner un JSON avec vos archives

// Modifiez la date pour tester immédiatement:
// lib/useMonthlyArchive.ts ligne ~27
// Changez: if ((now.getDate() >= 29
// À:       if ((now.getDate() >= 20  // Pour tester le 20 du mois

*/
