"use client";

// Cette page permet aux admins de voir et gérer les tâches supprimées.
// Elle affiche une liste avec options de restauration ou suppression définitive.

import { useState, useEffect } from "react";
import axios from "@/lib/axiosConfig";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import { useNotifications } from "@/lib/NotificationContext";

interface DeletedTask {
  id: number;
  title: string;
  description: string;
  createdBy: string;
  deleted_at: string;
  technicians?: Array<{ id: number; name: string }>;
}

export default function DeletedTasksPage() {
  const { user } = useAuth();
  const [deletedTasks, setDeletedTasks] = useState<DeletedTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [processing, setProcessing] = useState(false);

  // Charger les tâches supprimées depuis l'API au démarrage
  useEffect(() => {
    if (!user?.role || user.role !== "admin") {
      return; // Seuls les admins peuvent accéder
    }

    axios
      .get("/api/tasks-history")
      .then((res) => {
        setDeletedTasks(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Erreur chargement historique:", err);
        console.log("Erreur lors du chargement");
        setLoading(false);
      });
  }, [user]);

  // Fonctions pour sélectionner/désélectionner les tâches (checkboxes)
  const toggleSelect = (id: number) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === deletedTasks.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(deletedTasks.map((t) => t.id)));
    }
  };

  // Restaurer plusieurs tâches sélectionnées
  const restoreSelected = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Restaurer ${selectedIds.size} tâche(s) ?`)) return;

    setProcessing(true);
    try {
      await axios.post("/api/tasks/restore-many", {
        ids: Array.from(selectedIds),
      });

      setDeletedTasks(deletedTasks.filter((t) => !selectedIds.has(t.id)));
      setSelectedIds(new Set());
      console.log(`${selectedIds.size} tâche(s) restaurée(s)`);
    } catch (err: any) {
      console.error("Erreur restauration:", err);
      console.log("Erreur lors de la restauration");
    } finally {
      setProcessing(false);
    }
  };

  // Supprimer définitivement plusieurs tâches (action dangereuse)
  const forceDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    if (
      !confirm(
        `Êtes-vous certain de vouloir supprimer définitivement ${selectedIds.size} tâche(s) ? Cette action est irréversible.`
      )
    )
      return;

    setProcessing(true);
    try {
      await axios.post("/api/tasks/force-delete-many", {
        ids: Array.from(selectedIds),
      });

      setDeletedTasks(deletedTasks.filter((t) => !selectedIds.has(t.id)));
      setSelectedIds(new Set());
      console.log(`${selectedIds.size} tâche(s) supprimée(s) définitivement`);
    } catch (err: any) {
      console.error("Erreur suppression:", err);
      console.log("Erreur lors de la suppression");
    } finally {
      setProcessing(false);
    }
  };

  // Restaurer une seule tâche
  const restoreTask = async (id: number) => {
    setProcessing(true);
    try {
      await axios.post(`/api/tasks/${id}/restore`);
      setDeletedTasks(deletedTasks.filter((t) => t.id !== id));
      console.log("Tâche restaurée");
    } catch (err: any) {
      console.error("Erreur restauration:", err);
      console.log("Erreur lors de la restauration");
    } finally {
      setProcessing(false);
    }
  };

  // Supprimer définitivement une seule tâche
  const forceDeleteTask = async (id: number) => {
    if (!confirm(`Supprimer définitivement cette tâche ?`)) return;
    setProcessing(true);
    try {
      await axios.delete(`/api/tasks/${id}/force-delete`);
      setDeletedTasks(deletedTasks.filter((t) => t.id !== id));
      console.log("Tâche supprimée définitivement");
    } catch (err: any) {
      console.error("Erreur suppression:", err);
      console.log("Erreur lors de la suppression");
    } finally {
      setProcessing(false);
    }
  };

  // Vérifier si l'utilisateur est admin, sinon afficher message d'accès refusé
  if (!user || user.role !== "admin") {
    return (
      <div className="p-6 text-center">
        <h1 className="text-2xl font-bold text-red-600">Accès refusé</h1>
        <p className="text-gray-600 mt-2">
          Seuls les administrateurs peuvent voir cette page.
        </p>
        <Link href="/tasks" className="text-blue-500 mt-4 inline-block">
          ← Retour aux tâches
        </Link>
      </div>
    );
  }

  // Interface principale : titre, bouton retour, et contenu dynamique
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">🗑️ Tâches supprimées</h1>
        <Link
          href="/tasks"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          ← Retour
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-8">Chargement...</div>
      ) : deletedTasks.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
          <p className="text-yellow-800">
            Aucune tâche supprimée.
          </p>
        </div>
      ) : (
        <>
          {/* Barre d'actions pour sélectionner et agir en masse */}
          <div className="bg-gray-100 p-4 rounded mb-6 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedIds.size === deletedTasks.length && deletedTasks.length > 0}
                onChange={toggleSelectAll}
                className="w-5 h-5 cursor-pointer"
              />
              <span className="text-sm font-semibold">
                {selectedIds.size > 0 ? `${selectedIds.size} sélectionnée(s)` : "Sélectionner tout"}
              </span>
            </div>

            {selectedIds.size > 0 && (
              <div className="flex gap-2 ml-auto">
                <button
                  onClick={restoreSelected}
                  disabled={processing}
                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
                >
                  ✅ Restaurer ({selectedIds.size})
                </button>
                <button
                  onClick={forceDeleteSelected}
                  disabled={processing}
                  className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
                >
                  🗑️ Supprimer définitivement ({selectedIds.size})
                </button>
              </div>
            )}
          </div>

          {/* Tableau pour afficher les tâches supprimées avec détails et actions */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead className="bg-gray-200">
                <tr>
                  <th className="border border-gray-300 p-2 w-12">
                    <input
                      type="checkbox"
                      checked={selectedIds.size === deletedTasks.length && deletedTasks.length > 0}
                      onChange={toggleSelectAll}
                      className="w-5 h-5 cursor-pointer"
                    />
                  </th>
                  <th className="border border-gray-300 p-2 text-left">Titre</th>
                  <th className="border border-gray-300 p-2 text-left">Description</th>
                  <th className="border border-gray-300 p-2 text-left">Créée par</th>
                  <th className="border border-gray-300 p-2 text-left">
                    Techniciens assignés
                  </th>
                  <th className="border border-gray-300 p-2 text-left">
                    Date de suppression
                  </th>
                  <th className="border border-gray-300 p-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {/* Ligne pour chaque tâche supprimée */}
                {deletedTasks.map((task) => (
                  <tr key={task.id} className={selectedIds.has(task.id) ? "bg-blue-100" : "hover:bg-gray-50"}>
                    <td className="border border-gray-300 p-2 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(task.id)}
                        onChange={() => toggleSelect(task.id)}
                        className="w-5 h-5 cursor-pointer"
                      />
                    </td>
                    <td className="border border-gray-300 p-2 font-semibold">
                      {task.title}
                    </td>
                    <td className="border border-gray-300 p-2 text-sm">
                      {task.description || "-"}
                    </td>
                    <td className="border border-gray-300 p-2">{task.createdBy}</td>
                    <td className="border border-gray-300 p-2">
                      {task.technicians && task.technicians.length > 0
                        ? task.technicians.map((t) => t.name).join(", ")
                        : "-"}
                    </td>
                    <td className="border border-gray-300 p-2 text-sm">
                      {new Date(task.deleted_at).toLocaleDateString("fr-FR", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="border border-gray-300 p-2">
                      {/* Boutons pour restaurer ou supprimer cette tâche */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => restoreTask(task.id)}
                          disabled={processing}
                          className="bg-green-500 text-white px-2 py-1 text-sm rounded hover:bg-green-600 disabled:opacity-50"
                        >
                          Restaurer
                        </button>
                        <button
                          onClick={() => forceDeleteTask(task.id)}
                          disabled={processing}
                          className="bg-red-600 text-white px-2 py-1 text-sm rounded hover:bg-red-700 disabled:opacity-50"
                        >
                          Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
