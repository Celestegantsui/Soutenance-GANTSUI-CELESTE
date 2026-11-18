"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import axios from "@/lib/axiosConfig";
import { useAuth } from "@/lib/AuthContext";

export interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  data?: any;
  user_id: number;
  sender_id?: number;
  is_read: boolean;
  read_at?: string;
  action_url?: string;
  created_at: string;
  updated_at: string;
  sender?: {
    id: number;
    name: string;
    email: string;
  };
}

interface ToastNotification {
  id: string;
  message: string;
  type: "success" | "error" | "info" | "warning";
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  refreshNotifications: () => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: number) => Promise<void>;

  toastNotifications: ToastNotification[];
  addNotification: (
    message: string,
    type?: "success" | "error" | "info" | "warning"
  ) => void;
  removeToastNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isAuthenticated } = useAuth();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const [toastNotifications, setToastNotifications] = useState<ToastNotification[]>([]);

  /**
   * 🔄 FETCH NOTIFICATIONS
   */
  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;

    setLoading(true);
    try {
      const res = await axios.get("/api/notifications");

      const data = res.data.notifications.data || [];
      const unread = res.data.unread_count || 0;

      setNotifications(data);
      setUnreadCount(unread);
    } catch (error) {
      console.error("Error fetching notifications", error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  /**
   * ✅ Charger UNE SEULE FOIS (plus de boucle)
   */
  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
    }
  }, [isAuthenticated, fetchNotifications]);

  /**
   * ✅ MARK AS READ
   */
  const markAsRead = async (id: number) => {
    try {
      await axios.put(`/api/notifications/${id}/read`);

      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, is_read: true } : n
        )
      );

      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error markAsRead", error);
      throw error;
    }
  };

  /**
   * ✅ MARK ALL AS READ
   */
  const markAllAsRead = async () => {
    try {
      await axios.put("/api/notifications/mark-all-read");

      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: true }))
      );

      setUnreadCount(0);
    } catch (error) {
      console.error("Error markAllAsRead", error);
      throw error;
    }
  };

  /**
   * 🗑️ DELETE NOTIFICATION
   */
  const deleteNotification = async (id: number) => {
    try {
      await axios.delete(`/api/notifications/${id}`);

      setNotifications((prev) => prev.filter((n) => n.id !== id));

      const deletedNotification = notifications.find((n) => n.id === id);
      if (deletedNotification && !deletedNotification.is_read) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Error deleting notification", error);
      throw error;
    }
  };

  /**
   * 🔔 ADD TOAST
   */
  const addNotification = (
    message: string,
    type: "success" | "error" | "info" | "warning" = "info"
  ) => {
    const id = `toast-${Date.now()}`;
    const newToast: ToastNotification = { id, message, type };

    setToastNotifications((prev) => [...prev, newToast]);
  };

  /**
   * ❌ REMOVE TOAST
   */
  const removeToastNotification = (id: string) => {
    setToastNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        refreshNotifications: fetchNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,

        toastNotifications,
        addNotification,
        removeToastNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

/**
 * Hook
 */
export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotifications doit être utilisé à l'intérieur d'un NotificationProvider"
    );
  }
  return context;
};