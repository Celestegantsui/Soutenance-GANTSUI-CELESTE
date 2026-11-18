"use client";

import { useState, useEffect } from "react";
import axios from "@/lib/axiosConfig";

interface Task {
  id: number;
  title: string;
  description: string;
  status: string;
  createdBy: string | number;
  technician_id?: number;
  technician_ids?: number[];
  technician_name?: string;
  start_date?: string;
  end_date?: string;
}

// Cette fonction affiche la page "Voir les Tâches" qui regroupe les tâches par technicien
// avec une fonctionnalité de recherche pour filtrer par nom de technicien ou titre de tâche.
export default function ViewTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState(""); // État pour le terme de recherche

  // Charger les tâches depuis Laravel
  useEffect(() => {
    axios
      .get("/api/tasks")
      .then((res) => {
        console.log("Données brutes de l'API:", res.data);
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
        console.log("Tâches transformées:", transformedTasks);
        setTasks(transformedTasks);
      })
      .catch((err) => console.error(err));
  }, []);

  // Charger les techniciens depuis le backend
  useEffect(() => {
    axios
      .get("/api/technicians")
      .then((res) => {
        setTechnicians(res.data || []);
      })
      .catch((err) => console.error("Erreur chargement techniciens:", err));
  }, []);

  // Grouper les tâches par technicien
  const tasksByTechnician = technicians.reduce((acc: any, tech: any) => {
    acc[tech.id] = tasks.filter((task: any) => {
      // Matcher par assignation (technician_ids) puis fallback sur l'ancien champ
      const assignedIds = Array.isArray(task.technician_ids) ? task.technician_ids : [];
      const matchByAssignedId = assignedIds.some(
        (id: any) => String(id) === String(tech.id),
      );
      const matchById =
        task.technician_id && String(task.technician_id) === String(tech.id);
      // Fallback historique : `createdBy` parfois contient le nom
      const matchByName =
        task.createdBy &&
        String(task.createdBy).toLowerCase() ===
          String(tech.name).toLowerCase();
      return matchByAssignedId || matchById || matchByName;
    });
    console.log(`Tâches pour ${tech.name} (ID: ${tech.id}):`, acc[tech.id]);
    return acc;
  }, {});

  // Filtrer les techniciens selon le terme de recherche (nom du technicien ou titre de tâche)
  const filteredTechnicians = technicians.filter((technician: any) => {
    const techNameMatch = technician.name.toLowerCase().includes(searchTerm.toLowerCase());
    const taskMatch = tasksByTechnician[technician.id]?.some((task: Task) =>
      task.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return techNameMatch || taskMatch;
  });

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold mb-6">Voir les Tâches</h1>

      {/* Champ de recherche */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Rechercher un technicien ou une tâche..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full max-w-md p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Tableaux par technicien filtrés */}
      <div className="space-y-8">
        {filteredTechnicians.map((technician: any) => (
          <div key={technician.id} className="bg-white p-6 rounded-xl shadow">
            <h2 className="text-2xl font-bold mb-4 text-blue-600">{technician.name}</h2>
            
            {tasksByTechnician[technician.id]?.length === 0 ? (
              <p className="text-gray-500 italic">Aucune tâche pour ce technicien</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left border-b bg-gray-50">
                      <th className="py-3 px-4">#</th>
                      <th className="py-3 px-4">Titre</th>
                      <th className="py-3 px-4">Date début</th>
                      <th className="py-3 px-4">Date fin</th>
                      <th className="py-3 px-4">Statut</th>
                      <th className="py-3 px-4">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasksByTechnician[technician.id]?.map((t: Task) => (
                      <tr key={t.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">{t.id}</td>
                        <td className="py-3 px-4 font-medium">{t.title}</td>
                        <td className="py-3 px-4">
                          {t.start_date ? new Date(t.start_date).toLocaleDateString() : "-"}
                        </td>
                        <td className="py-3 px-4">
                          {t.end_date ? new Date(t.end_date).toLocaleDateString() : "-"}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-semibold ${
                              t.status === "terminé"
                                ? "bg-green-100 text-green-800"
                                : "bg-orange-100 text-orange-800"
                            }`}
                          >
                            {t.status}
                          </span>
                        </td>
                        <td className="py-3 px-4">{t.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
