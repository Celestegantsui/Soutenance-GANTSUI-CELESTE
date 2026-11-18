"use client";

import { useState, useEffect } from "react";
import axios from "@/lib/axiosConfig"; // Importer depuis axiosConfig qui a l'intercepteur
import { useNotifications } from "@/lib/NotificationContext";
import { useAuth } from "@/lib/AuthContext";
import { useThemeColors } from "@/lib/useThemeColors";
import Link from "next/link";

interface Task {
  id: number;
  title: string;
  description: string;
  status: string;
  createdBy: string | number;
  technician_id?: number;
  technician_ids?: number[];
  technician_name?: string;
  technicians?: Array<{ id: number; name?: string }>;
  start_date?: string;
  end_date?: string;
}

type TaskFilter = "all" | "in-progress" | "completed" | "overdue";

function isCompletedTask(status: string) {
  const normalizedStatus = status.trim().toLowerCase();
  return normalizedStatus === "terminé" || normalizedStatus === "termine";
}

export default function TasksPage() {
  const { user } = useAuth();
  const { colors } = useThemeColors();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskFilter, setTaskFilter] = useState<TaskFilter>("all");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [processing, setProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const today = new Date().toISOString().slice(0, 10);
  const visibleTasks = tasks.filter((task) => {
    if (taskFilter === "in-progress") {
      return task.status.trim().toLowerCase() === "en cours";
    }
    if (taskFilter === "completed") {
      return isCompletedTask(task.status);
    }
    if (taskFilter === "overdue") {
      return Boolean(task.end_date) &&
        task.end_date!.slice(0, 10) < today &&
        !isCompletedTask(task.status);
    }
    return true;
  });

  // Charger les tâches depuis Laravel
  useEffect(() => {
    axios
      .get("/api/tasks")
      .then((res) => {
        console.log("Données brutes de l'API (tasks):", res.data);
        const tasks = Array.isArray(res.data?.tasks) ? res.data.tasks : [];
        const transformedTasks = tasks.map((task: any) => ({
          id: task.id,
          title: task.title,
          description: task.description,
          status: task.status,
          createdBy: task.createdBy || task.technician_id || task.technician?.id,
          technician_id: task.technician_id || task.technician?.id,
          technician_name: task.technician_name || task.technician?.name || task.createdBy,
          technician_ids:
            task.technician_ids ??
            (Array.isArray(task.technicians)
              ? task.technicians.map((t: any) => t.id)
              : task.technician_id
                ? [task.technician_id]
                : task.technician?.id
                  ? [task.technician.id]
                  : []),
          start_date: task.start_date,
          end_date: task.end_date,
        }));
        console.log("Tâches transformées (tasks):", transformedTasks);
        setTasks(transformedTasks);

        const filter = new URLSearchParams(window.location.search).get("filter");
        if (
          filter === "in-progress" ||
          filter === "completed" ||
          filter === "overdue"
        ) {
          setTaskFilter(filter);
        }
      })
      .catch((err) => console.error(err));
  }, []);

  // États du formulaire
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newStatus, setNewStatus] = useState("en cours");
  const [newTechnicianIds, setNewTechnicianIds] = useState<string[]>([]);
  const [newStartDate, setNewStartDate] = useState("");
  const [newEndDate, setNewEndDate] = useState("");

  // Liste des techniciens
  const [technicians, setTechnicians] = useState<any[]>([]);

  // Notification context
  const { addNotification } = useNotifications();

  // Charger les techniciens depuis le backend
  useEffect(() => {
    axios
      .get("http://127.0.0.1:8000/api/technicians")
      .then((res) => {
        setTechnicians(res.data || []);
      })
      .catch((err) => console.error("Erreur chargement techniciens:", err));
  }, []);

  // Ajouter ou modifier une tâche
  const resetModalForm = () => {
    setShowModal(false);
    setEditingId(null);
    setNewTitle("");
    setNewDescription("");
    setNewStatus("en cours");
    setNewTechnicianIds([]);
    setNewStartDate("");
    setNewEndDate("");
  };

  const saveTask = async () => {
    if (!newTitle.trim()) return;
    const technician_ids = newTechnicianIds
      .map((id) => parseInt(id, 10))
      .filter((n) => Number.isFinite(n));

    if (
      user &&
      user.role !== "admin" &&
      !technician_ids.includes(Number(user.id))
    ) {
      technician_ids.push(Number(user.id));
    }

    console.log(
      "Payload technician_ids:",
      technician_ids,
      "editingId:",
      editingId,
    );

    setIsSaving(true);
    try {
      const techNames =
        technician_ids
          .map((id) => technicians.find((t) => t.id === id)?.name)
          .filter(Boolean)
          .join(", ") || technician_ids.join(", ");

      if (editingId) {
        // Modification
        await axios.put(
          `http://127.0.0.1:8000/api/tasks/${editingId}`,
          {
            title: newTitle,
            description: newDescription,
            status: newStatus,
            technician_ids,
            start_date: newStartDate || null,
            end_date: newEndDate || null,
          },
        );
        addNotification(
          `Tâche modifiée : "${newTitle}" pour ${techNames} (${technician_ids.length} technicien(s))`,
        );
      } else {
        // Création
        await axios.post("http://127.0.0.1:8000/api/tasks", {
          title: newTitle,
          description: newDescription,
          status: newStatus,
          technician_ids,
          start_date: newStartDate || null,
          end_date: newEndDate || null,
        });
        addNotification(
          `Nouvelle tâche créée : "${newTitle}" pour ${techNames} (${technician_ids.length} technicien(s))`,
        );
      }

      // Recharger toutes les tâches
      const listRes = await axios.get("http://127.0.0.1:8000/api/tasks");
      const tasks = Array.isArray(listRes.data?.tasks) ? listRes.data.tasks : [];
      const transformedTasks = tasks.map((task: any) => ({
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        createdBy: task.createdBy || task.technician_id || task.technician?.id,
        technician_id: task.technician_id || task.technician?.id,
        technician_name:
          task.technician_name ||
          task.technician?.name ||
          task.createdBy,
        technician_ids:
          task.technician_ids ??
          (Array.isArray(task.technicians)
            ? task.technicians.map((t: any) => t.id)
            : task.technician_id
              ? [task.technician_id]
              : task.technician?.id
                ? [task.technician.id]
                : []),
        start_date: task.start_date,
        end_date: task.end_date,
      }));
      console.log("Tâches rechargées:", transformedTasks);
      setTasks(transformedTasks);

      resetModalForm();
    } catch (err: any) {
      console.error("Erreur saveTask complète:", err);
      console.error("Erreur response:", err?.response);
      console.error("Erreur response data:", err?.response?.data);
      
      let serverMessage = "Erreur inconnue";
      
      if (err?.response?.data) {
        const serverData = err.response.data;
        if (typeof serverData === "string") {
          serverMessage = serverData;
        } else if (serverData?.message) {
          serverMessage = serverData.message;
        } else if (serverData?.error) {
          serverMessage = serverData.error;
        } else {
          serverMessage = JSON.stringify(serverData);
        }
      } else if (err?.message) {
        serverMessage = err.message;
      }

      console.log("Message finalisé:", serverMessage);
      addNotification(
        `Erreur ${editingId ? "modification" : "création"}: ${serverMessage}`,
      );
    } finally {
      setIsSaving(false);
    }
  };

  const openEditModal = (task: Task) => {
    setEditingId(task.id);
    setNewTitle(task.title);
    setNewDescription(task.description);
    setNewStatus(task.status);
    // Le backend peut retourner soit `technician_ids`, soit un seul `technician_id`.
    if (task.technician_ids && task.technician_ids.length > 0) {
      setNewTechnicianIds(task.technician_ids.map(String));
    } else if (task.technician_id) {
      setNewTechnicianIds([String(task.technician_id)]);
    } else if (task.createdBy !== undefined && task.createdBy !== null) {
      const createdByStr = String(task.createdBy);
      const matchedTechnicianId =
        technicians.find(
          (t) => t.name === createdByStr || String(t.id) === createdByStr,
        )?.id ?? null;
      setNewTechnicianIds([matchedTechnicianId ? String(matchedTechnicianId) : createdByStr]);
    } else {
      setNewTechnicianIds([]);
    }
    setNewStartDate(task.start_date || "");
    setNewEndDate(task.end_date || "");
    setShowModal(true);
  };

  const closeModal = () => {
    resetModalForm();
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    const visibleIds = visibleTasks.map((task) => task.id);
    if (visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id))) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(visibleIds));
    }
  };

  const deleteSelectedTasks = async () => {
    if (selectedIds.size === 0) return;

    const count = selectedIds.size;
    if (!confirm(`Voulez-vous vraiment supprimer ${count} tâche${count > 1 ? "s" : ""} ?`)) {
      return;
    }

    setProcessing(true);
    try {
      const deletePromises = Array.from(selectedIds).map((id) =>
        axios.delete(`http://127.0.0.1:8000/api/tasks/${id}`)
      );
      await Promise.all(deletePromises);

      setTasks(tasks.filter(t => !selectedIds.has(t.id)));
      setSelectedIds(new Set());
      addNotification(`${count} tâche${count > 1 ? "s" : ""} supprimée${count > 1 ? "s" : ""}`);
    } catch (error) {
      console.error("Erreur suppression:", error);
      addNotification("Erreur lors de la suppression");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-3">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Liste des tâches</h1>
        {user && (
          <div className="text-xs">
            <span className="font-semibold">{user.name}</span>
            <span className="ml-2 px-2 py-1 rounded-full text-white text-xs"
              style={{
                backgroundColor: user.role === "admin" ? "#ef4444" : "#3b82f6"
              }}
            >
              {user.role === "admin" ? "👨‍💼 Admin" : "👷 Technicien"}
            </span>
          </div>
        )}
      </div>
      {/* Boutons d'action */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
        >
          ➕ Créer une tâche
        </button>
        
        {user?.role === "admin" && (
          <Link
            href="/deleted-tasks"
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-sm"
          >
            🗑️ Tâches supprimées
          </Link>
        )}

        {selectedIds.size > 0 && (
          <>
            <button
              onClick={toggleSelectAll}
              className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 text-sm"
            >
              {visibleTasks.length > 0 && visibleTasks.every((task) => selectedIds.has(task.id))
                ? "Désélectionner tout"
                : "Sélectionner tout"}
            </button>
            {user?.role === "admin" && (
              <button
                onClick={deleteSelectedTasks}
                disabled={processing}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm"
              >
                {processing ? "Suppression..." : `Supprimer ${selectedIds.size}`}
              </button>
            )}
          </>
        )}
      </div>

      {/* Tableau compact - Tout visible sans scrollbar */}
      <div className="bg-white p-3 rounded-xl shadow">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="text-left border-b bg-gray-50">
              {user?.role === "admin" && (
                <th className="py-2 px-2">
                  <input
                    type="checkbox"
                    checked={visibleTasks.length > 0 && visibleTasks.every((task) => selectedIds.has(task.id))}
                    onChange={toggleSelectAll}
                    disabled={visibleTasks.length === 0}
                    className="w-3 h-3 cursor-pointer"
                  />
                </th>
              )}
              <th className="py-2 px-2">#</th>
              <th className="py-2 px-2">Titre</th>
              <th className="py-2 px-2">Créée par</th>
              <th className="py-2 px-2">Techniciens</th>
              <th className="py-2 px-2">Début</th>
              <th className="py-2 px-2">Fin</th>
              <th className="py-2 px-2">Statut</th>
              <th className="py-2 px-2">Description</th>
              <th className="py-2 px-2">Actions</th>
            </tr>
          </thead>

          <tbody>
            {visibleTasks.map((t) => {
              const technicianName = technicians.find(
                (tech) => tech.id === t.createdBy
              )?.name || t.createdBy;

              const assignedIds = Array.isArray(t.technician_ids)
                ? t.technician_ids
                : t.technician_id
                  ? [t.technician_id]
                  : [];
              const assignedNames = assignedIds
                .map((id) => technicians.find((tech) => String(tech.id) === String(id))?.name)
                .filter(Boolean)
                .join(", ");
              const assignedDisplay = assignedNames || (assignedIds.length ? assignedIds.join(", ") : "-");
              const isSelected = selectedIds.has(t.id);
              const canEditTask =
                user?.role === "admin" ||
                (user?.role === "technicien" &&
                  assignedIds.some((id) => Number(id) === Number(user.id)));
              return (
                <tr 
                  key={t.id} 
                  className={`border-b hover:bg-gray-50 ${isSelected ? "bg-blue-50" : ""}`}
                >
                  {user?.role === "admin" && (
                    <td className="py-2 px-2">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(t.id)}
                        className="w-3 h-3 cursor-pointer"
                      />
                    </td>
                  )}
                  <td className="py-2 px-2">{t.id}</td>
                  <td className="py-2 px-2 font-medium">{t.title}</td>
                  <td className="py-2 px-2">{technicianName}</td>
                  <td className="py-2 px-2">{assignedDisplay}</td>
                  <td className="py-2 px-2">
                    {t.start_date ? new Date(t.start_date).toLocaleDateString("fr-FR") : "-"}
                  </td>
                  <td className="py-2 px-2">
                    {t.end_date ? new Date(t.end_date).toLocaleDateString("fr-FR") : "-"}
                  </td>
                  <td
                    className={`py-2 px-2 font-semibold ${
                      t.status === "terminé" ? "text-green-600" : "text-orange-500"
                    }`}
                  >
                    {t.status}
                  </td>
                  <td className="py-2 px-2 text-gray-600">{t.description}</td>
                  <td className="py-2 px-2">
                    <div className="flex gap-1">
                      {canEditTask && (
                        <button
                          onClick={() => openEditModal(t)}
                          className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 text-xs"
                        >
                          Modifier
                        </button>
                      )}
                      {user?.role === "admin" && (
                        <button
                          onClick={() => {
                            if (confirm(`Supprimer "${t.title}" ?`)) {
                              axios
                                .delete(`http://127.0.0.1:8000/api/tasks/${t.id}`)
                                .then(() => {
                                  setTasks(tasks.filter(task => task.id !== t.id));
                                  addNotification(`"${t.title}" supprimée`);
                                })
                                .catch((err) => {
                                  console.error("Erreur suppression:", err);
                                  addNotification("Erreur lors de la suppression");
                                });
                            }
                          }}
                          className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 text-xs"
                        >
                          Supprimer
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {isSaving && (
        <div className="fixed inset-0 flex items-center justify-center backdrop-blur-md z-50">
          <div className="bg-white bg-opacity-80 p-4 rounded text-black text-xl">Chargement...</div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-gray-950/85 p-4 backdrop-blur-sm">
          <section className="w-full max-w-2xl rounded-2xl border border-gray-100 bg-white p-6 shadow-xl">
            <h2 className="mb-5 text-xl font-bold text-gray-900">
              {editingId ? "Modifier la tâche" : "Créer une tâche"}
            </h2>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="text-sm font-medium text-gray-700">
                Titre de la tâche
                <input
                  required
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 p-2.5"
                />
              </label>

              <label className="text-sm font-medium text-gray-700">
                Statut
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 p-2.5"
                >
                  <option value="en cours">En cours</option>
                  <option value="terminé">Terminé</option>
                </select>
              </label>

              <label className="text-sm font-medium text-gray-700 md:col-span-2">
                Description
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="mt-1 min-h-24 w-full rounded-lg border border-gray-300 p-2.5"
                />
              </label>

              <label className="text-sm font-medium text-gray-700">
                Date de début
                <input
                  type="date"
                  className="mt-1 w-full rounded-lg border border-gray-300 p-2.5"
                  value={newStartDate}
                  onChange={(e) => setNewStartDate(e.target.value)}
                />
              </label>

              <label className="text-sm font-medium text-gray-700">
                Date de fin
                <input
                  type="date"
                  className="mt-1 w-full rounded-lg border border-gray-300 p-2.5"
                  value={newEndDate}
                  onChange={(e) => setNewEndDate(e.target.value)}
                />
              </label>

              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-700">
                  Techniciens (multi-sélection)
                </label>
                <div className="mt-1 max-h-36 w-full overflow-y-auto rounded-lg border border-gray-300 bg-white p-2.5">
                  <p className="mb-2 text-xs text-gray-500">
                    {user?.role === "admin"
                      ? "Vous pouvez laisser la tâche sans assignation."
                      : "Votre compte sera automatiquement ajouté aux personnes assignées."}
                  </p>
                  {technicians && technicians.length > 0 ? (
                    technicians.map((tech: any) => {
                      const idStr = String(tech.id);
                      const checked = newTechnicianIds.includes(idStr);
                      return (
                        <label key={tech.id} className="flex cursor-pointer items-center gap-2 py-1 text-sm text-gray-700">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              setNewTechnicianIds((prev) => {
                                const next = prev.includes(idStr)
                                  ? prev.filter((id) => id !== idStr)
                                  : [...prev, idStr];
                                const currentUserId = String(user?.id);

                                if (
                                  user?.role !== "admin" &&
                                  next.length > 0 &&
                                  !next.includes(currentUserId)
                                ) {
                                  next.push(currentUserId);
                                }

                                return next;
                              });
                            }}
                          />
                          {tech.name}
                        </label>
                      );
                    })
                  ) : (
                    <p className="text-sm text-gray-500">Aucun technicien disponible</p>
                  )}
                </div>
              </div>

            </div>
            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={closeModal}
                className="rounded-lg border border-gray-300 px-5 py-2.5 text-gray-700 hover:bg-gray-50"
              >
                Annuler
              </button>

              <button
                onClick={saveTask}
                disabled={isSaving}
                className="rounded-lg px-5 py-2.5 font-medium text-white disabled:opacity-60"
                style={{ backgroundColor: colors.bg }}
              >
                {isSaving ? "Enregistrement..." : editingId ? "Enregistrer les modifications" : "Créer la tâche"}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}