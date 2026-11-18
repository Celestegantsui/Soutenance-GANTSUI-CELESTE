# Système d'Historique et Statistiques Mensuelles

## 📊 Vue d'ensemble

Ce système crée automatiquement un historique des tâches et réunions à la fin de chaque mois, avec :
- **Courbes statistiques** : Taux d'accomplissement, vitesse d'exécution
- **Comparaison mensuelle** : Évolution des performances
- **Statistiques réunions** : Nombre et durée totale
- **Archivage automatique** : Sauvegarde backend des données

## 🚀 Fonctionnalités principales

### 1. **Graphiques de tendance** (Page History)
- Taux d'accomplissement mensuel (%)
- Vitesse d'exécution moyenne (jours)
- Volume de tâches (total vs complétées)
- Nombre de réunions par mois

### 2. **Statistiques détaillées** par mois
- Taux de réussite
- Temps moyen pour complétée une tâche
- Distribution des statuts (complétées, en attente, en cours)
- Durée totale des réunions en heures

### 3. **Archivage automatique**
Les données sont archivées automatiquement à la fin du mois (à partir du 29e jour)

## 📁 Fichiers créés

### Backend
- `app/api/archives/route.ts` - API REST pour gérer les archives

### Librairies
- `lib/historyStorage.ts` - Gestion du stockage et des statistiques
- `lib/useMonthlyArchive.ts` - Hook pour l'archivage automatique
- `lib/demoData.ts` - Générateur de données de test

### Frontend
- `app/history/page.tsx` - Page d'affichage des statistiques

## 🔧 Intégration avec vos pages de tâches

### Option 1 : Intégration dans votre composant TaskPage

```tsx
import { useMonthlyArchive } from "@/lib/useMonthlyArchive";

export default function TaskPage() {
  const [tasks, setTasks] = useState([]);
  const [meetings, setMeetings] = useState([]);

  // Ajouter le hook pour l'archivage automatique
  useMonthlyArchive(tasks, meetings, (archive) => {
    console.log("Données archivées pour le mois:", archive.month);
    // Optionnel : envoyer au backend
  });

  // ... reste du code
}
```

### Option 2 : Format des données

Assurez-vous que vos tâches suivent cette structure :

```typescript
interface TaskData {
  id: string;
  title: string;
  status: "completed" | "pending" | "in-progress";
  assignedTo: string;
  createdDate: string; // "YYYY-MM-DD"
  completedDate?: string; // "YYYY-MM-DD"
  daysToComplete?: number; // calculé automatiquement
}

interface MeetingData {
  id: string;
  title: string;
  date: string; // "YYYY-MM-DD"
  duration: number; // en minutes
  participants: string[]; // liste des noms
  notes?: string;
}
```

## 📈 Comment ça marche

### Archivage automatique
1. Le hook `useMonthlyArchive` vérifie toutes les heures si c'est la fin du mois
2. Quand on atteint le 29+ du mois, les données sont archivées
3. Les archives sont sauvegardées dans localStorage (frontend) et backend (API)

### Calcul des statistiques
```
Taux réussite = (tâches complétées / total tâches) × 100
Temps moyen = somme(daysToComplete) / nombre tâches complétées
```

## 🧪 Test avec données de démonstration

1. Ouvrez `http://localhost:3000/history`
2. Cliquez sur "Charger les données de démonstration"
3. Voyez les 6 mois d'historique avec statistiques et courbes

## 📊 Personnalisation

### Modifier les couleurs des graphiques
Éditez les constantes dans `app/history/page.tsx` :
```tsx
const COLORS = ["#10b981", "#f97316", "#ef4444", "#8b5cf6"];
```

### Modifier la fréquence de vérification
Dans `lib/useMonthlyArchive.ts`, ligne `const interval = setInterval(checkAndArchive, 3600000);`
- `3600000` = 1 heure
- Pour tester : `10000` = 10 secondes

### Ajouter plus de statistiques
Éditez les fonctions dans `lib/historyStorage.ts` pour ajouter des métriques personnalisées

## 🔌 Intégration API (Backend réel)

Pour utiliser une vraie base de données :

```typescript
// Envoyer une archive au backend
async function sendArchiveToBackend(archive: MonthlyArchive) {
  const response = await fetch("/api/archives", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(archive),
  });
  return response.json();
}
```

## 📝 Notes importantes

- Les données sont stockées en **localStorage** (côté client) par défaut
- L'API backend stocke également une copie en mémoire
- Pour la production, connectez à une vraie base de données (PostgreSQL, MongoDB, etc.)
- L'archivage est **automatique** mais peut être déclenchché manuellement si nécessaire
