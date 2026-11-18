import React from "react";
import { useNotifications } from "@/lib/NotificationContext";

export const ToastNotificationContainer: React.FC = () => {
  const { toastNotifications, removeToastNotification } = useNotifications();

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 max-w-md">
      {toastNotifications.map((notification) => (
        <div
          key={notification.id}
          className={`p-4 rounded-lg shadow-lg flex items-start justify-between gap-3 animate-slideIn ${
            notification.type === "success"
              ? "bg-green-100 border-l-4 border-green-500 text-green-800"
              : notification.type === "error"
                ? "bg-red-100 border-l-4 border-red-500 text-red-800"
                : notification.type === "warning"
                  ? "bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800"
                  : "bg-blue-100 border-l-4 border-blue-500 text-blue-800"
          }`}
        >
          <div className="flex items-start gap-3 flex-1">
            {/* Icône */}
            <div className="flex-shrink-0 text-xl">
              {notification.type === "success" && "✅"}
              {notification.type === "error" && "❌"}
              {notification.type === "warning" && "⚠️"}
              {notification.type === "info" && "ℹ️"}
            </div>
            {/* Message */}
            <div className="flex-1">
              <p className="text-sm font-medium">{notification.message}</p>
            </div>
          </div>
          {/* Bouton fermer */}
          <button
            onClick={() => removeToastNotification(notification.id)}
            className="flex-shrink-0 text-lg hover:opacity-70 transition-opacity"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
};