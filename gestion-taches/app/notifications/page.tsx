"use client";

import { useNotifications } from "@/lib/NotificationContext";
import { useState } from "react";
import axios from "@/lib/axiosConfig";

export default function NotificationsPage() {
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications,
  } = useNotifications();

  // state sélection
  const [selected, setSelected] = useState<number[]>([]);

  // sélectionner / désélectionner
  const toggleSelect = (id: number) => {
    setSelected((prev) =>
      prev.includes(id)
        ? prev.filter((i) => i !== id)
        : [...prev, id]
    );
  };

  // tout sélectionner
  const selectAll = () => {
    if (selected.length === notifications.length) {
      setSelected([]);
    } else {
      setSelected(notifications.map((n) => n.id));
    }
  };

  // supprimer sélection
  const deleteSelected = async () => {
    try {
      await axios.post("/api/notifications/delete-many", {
        ids: selected,
      });

      setSelected([]);
      await refreshNotifications();
    } catch (error) {
      console.error("Erreur suppression", error);
    }
  };

  // Supprimer une notification individuelle
  const handleDeleteNotification = async (id: number) => {
    try {
      await deleteNotification(id);
    } catch (error) {
      console.error("Erreur suppression notification", error);
    }
  };

  // Marquer comme lue et rafraîchir
  const handleMarkAsRead = async (id: number) => {
    try {
      await markAsRead(id);
    } catch (error) {
      console.error("Erreur marquage comme lue", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Notifications</h1>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
              {unreadCount} non lue{unreadCount > 1 ? "s" : ""}
            </span>
          )}

          {notifications.length > 0 && unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition"
            >
              Tout marquer comme lu
            </button>
          )}
        </div>
      </div>

      {/* ACTIONS */}
      {notifications.length > 0 && (
        <div className="flex items-center gap-3 mb-3 text-sm">
          <input
            type="checkbox"
            onChange={selectAll}
            checked={
              selected.length === notifications.length &&
              notifications.length > 0
            }
          />
          <span>Tout sélectionner</span>

          {selected.length > 0 && (
            <button
              onClick={deleteSelected}
              className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600 transition"
            >
              Supprimer ({selected.length})
            </button>
          )}
        </div>
      )}

      {/* LISTE */}
      <div className="bg-white p-3 rounded-lg shadow space-y-2">
        {loading ? (
          <p className="text-gray-500 text-sm">Chargement des notifications...</p>
        ) : notifications.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-4">Aucune notification</p>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className={`p-2 border rounded flex gap-2 text-sm ${
                n.is_read
                  ? "bg-gray-50 border-gray-200"
                  : "bg-blue-50 border-blue-200"
              } hover:bg-gray-100 transition-colors`}
            >
              {/* checkbox */}
              <input
                type="checkbox"
                checked={selected.includes(n.id)}
                onChange={() => toggleSelect(n.id)}
                className="mt-0.5"
              />

              {/* CONTENU */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 flex-wrap">
                      <h3 className="font-semibold text-sm">{n.title}</h3>
                      {!n.is_read && (
                        <span className="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded text-xs font-semibold whitespace-nowrap">
                          Non lu
                        </span>
                      )}
                    </div>
                    <p className="text-gray-700 text-xs mt-0.5 truncate">{n.message}</p>

                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 flex-wrap">
                      <span className="truncate">
                        {new Date(n.created_at).toLocaleString("fr-FR", {
                          year: "2-digit",
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>

                      {n.sender && (
                        <span className="truncate">Par: <strong>{n.sender.name}</strong></span>
                      )}
                    </div>
                  </div>

                  {/* BOUTONS D'ACTION */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {!n.is_read && (
                      <button
                        onClick={() => handleMarkAsRead(n.id)}
                        className="px-2 py-0.5 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition whitespace-nowrap"
                      >
                        Lire
                      </button>
                    )}

                    <button
                      onClick={() => handleDeleteNotification(n.id)}
                      className="px-2 py-0.5 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition whitespace-nowrap"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {/* VOIR LES DÉTAILS */}
                {n.action_url && (
                  <div className="mt-1">
                    <a
                      href={n.action_url}
                      className="text-blue-600 hover:text-blue-800 text-xs underline"
                    >
                      Voir les détails →
                    </a>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}