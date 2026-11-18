"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "@/lib/axiosConfig";
import { useAuth } from "@/lib/AuthContext";

interface Task {
  id: number;
  title: string;
  description: string;
  status: string;
  createdBy: string | number;
  technician_name?: string;
  start_date?: string;
  end_date?: string;
  assigned_to?: number;
  assigned_user?: {
    id: number;
    name: string;
    email: string;
  };
  technicians?: Array<{
    id: number;
    name: string;
    email: string;
    role: string;
    status: string;
  }>;
  created_at: string;
  updated_at: string;
}

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.id) {
      fetchTask();
    }
  }, [params.id]);

  const fetchTask = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setError("Vous devez être connecté pour voir cette tâche");
        return;
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
      console.log('API URL:', apiUrl);
      console.log('Token exists:', !!token);

      const response = await fetch(`${apiUrl}/api/tasks/${params.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 404) {
        const data = await response.json();
        if (data.deleted) {
          setError("Cette tâche a été supprimée par l'administrateur");
        } else {
          setError("Erreur lors du chargement de la tâche");
        }
      } else if (!response.ok) {
        setError("Erreur lors du chargement de la tâche");
      } else {
        const data = await response.json();
        setTask(data);
      }
    } catch (err: any) {
      console.error("Erreur chargement tâche:", err);
      setError("Erreur lors du chargement de la tâche");
    } finally {
      setLoading(false);
    }
  };

  // ✅ NOUVELLE FONCTION : Vérifier si l'utilisateur peut modifier le statut
  const canEditStatus = (): boolean => {
    if (!user || !task) return false;

    console.log('User role:', user.role);
    console.log('User id:', user.id);
    console.log('Task createdBy:', task.createdBy);
    console.log('Task technicians:', task.technicians);

    // ✅ Les admins peuvent toujours modifier
    if (user.role === "admin") {
      console.log('User is admin - can edit');
      return true;
    }

    // ✅ Le créateur de la tâche peut modifier
    if (String(user.id) === String(task.createdBy)) {
      console.log('User is creator - can edit');
      return true;
    }

    // ✅ Les techniciens assignés à la tâche peuvent modifier
    if (task.technicians && task.technicians.some(tech => tech.id === user.id)) {
      console.log('User is assigned technician - can edit');
      return true;
    }

    console.log('User cannot edit this task');
    return false;
  };

  // ✅ MODIFIÉ : Envoyer tous les champs nécessaires
  const updateTaskStatus = async (newStatus: string) => {
    try {
      if (!task) return;

      // Vérifier les permissions
      if (!canEditStatus()) {
        setError("Vous n'avez pas la permission de modifier le statut de cette tâche");
        return;
      }

      // Envoyer TOUS les champs, pas seulement le statut
      await axios.put(`/api/tasks/${params.id}`, {
        title: task.title,
        description: task.description,
        status: newStatus,
        technician_ids: task.technicians ? task.technicians.map(tech => tech.id) : [],
        start_date: task.start_date || null,
        end_date: task.end_date || null,
      });

      // Recharger la tâche après mise à jour
      await fetchTask();
      setError(null); // Effacer les erreurs précédentes
    } catch (err: any) {
      console.error("Erreur mise à jour statut:", err);
      console.error("Erreur response:", err?.response);
      console.error("Erreur response data:", err?.response?.data);
      
      let errorMessage = "Erreur lors de la mise à jour du statut";
      
      if (err?.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err?.response?.data?.error) {
        errorMessage = err.response.data.error;
      }
      
      setError(errorMessage);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement de la tâche...</p>
        </div>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            {error || "Tâche non trouvée"}
          </h1>
          <p className="text-gray-600 mb-4">
            La tâche que vous recherchez n'existe pas ou vous n'avez pas les permissions pour la voir.
          </p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
          >
            ← Retour
          </button>
          <h1 className="text-3xl font-bold">Détails de la tâche</h1>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-2xl font-semibold mb-4">{task.title}</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <p className="text-gray-900 bg-gray-50 p-3 rounded">
                    {task.description || "Aucune description"}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Statut
                  </label>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      task.status.toLowerCase() === 'terminé' || task.status.toLowerCase() === 'termine'
                        ? 'bg-green-100 text-green-800'
                        : task.status.toLowerCase() === 'en cours'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {task.status}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Créée par
                  </label>
                  <p className="text-gray-900">{task.technician_name || task.createdBy}</p>
                </div>

                {/* ✅ NOUVEAU : Afficher tous les techniciens assignés */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Techniciens assignés
                  </label>
                  {task.technicians && task.technicians.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {task.technicians.map((technician, index) => (
                        <span key={technician.id || index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                          {technician.name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">Aucun technicien assigné</p>
                  )}
                </div>

                {task.assigned_user && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Assignée à
                    </label>
                    <p className="text-gray-900">{task.assigned_user.name}</p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Dates</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date de création
                  </label>
                  <p className="text-gray-900">
                    {new Date(task.created_at).toLocaleString('fr-FR')}
                  </p>
                </div>

                {task.start_date && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date de début
                    </label>
                    <p className="text-gray-900">
                      {new Date(task.start_date).toLocaleString('fr-FR')}
                    </p>
                  </div>
                )}

                {task.end_date && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date de fin
                    </label>
                    <p className="text-gray-900">
                      {new Date(task.end_date).toLocaleString('fr-FR')}
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dernière modification
                  </label>
                  <p className="text-gray-900">
                    {new Date(task.updated_at).toLocaleString('fr-FR')}
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-4">Actions</h3>

                {/* ✅ Message d'erreur si pas de permission */}
                {!canEditStatus() && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-4 text-sm text-yellow-800">
                    ⚠️ Vous n'avez pas la permission de modifier le statut de cette tâche.
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  {task.status.toLowerCase() !== 'terminé' && task.status.toLowerCase() !== 'termine' && (
                    <button
                      onClick={() => updateTaskStatus('terminé')}
                      disabled={!canEditStatus()}
                      className={`px-4 py-2 rounded ${
                        canEditStatus()
                          ? 'bg-green-500 text-white hover:bg-green-600 cursor-pointer'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      Marquer comme terminée
                    </button>
                  )}

                  {task.status.toLowerCase() === 'terminé' || task.status.toLowerCase() === 'termine' ? (
                    <button
                      onClick={() => updateTaskStatus('en cours')}
                      disabled={!canEditStatus()}
                      className={`px-4 py-2 rounded ${
                        canEditStatus()
                          ? 'bg-blue-500 text-white hover:bg-blue-600 cursor-pointer'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      Remettre en cours
                    </button>
                  ) : (
                    <button
                      onClick={() => updateTaskStatus('en cours')}
                      disabled={!canEditStatus()}
                      className={`px-4 py-2 rounded ${
                        canEditStatus()
                          ? 'bg-blue-500 text-white hover:bg-blue-600 cursor-pointer'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      Marquer en cours
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}