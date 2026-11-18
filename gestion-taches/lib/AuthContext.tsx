"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // charge token/user depuis localStorage au démarrage
  useEffect(() => {
    const loadUser = async () => {
      const saved = localStorage.getItem("auth_token");
      if (saved) {
        setToken(saved);
        try {
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/me`,
            {
              headers: {
                Authorization: `Bearer ${saved}`,
                "Content-Type": "application/json",
              },
              credentials: "include",
            }
          );
          if (res.ok) {
            const data = await res.json();
            setUser(data);
          } else {
            // token invalide
            localStorage.removeItem("auth_token");
            setToken(null);
          }
        } catch (err) {
          console.error("Error loading user", err);
          localStorage.removeItem("auth_token");
          setToken(null);
        }
      }
      setLoading(false);
    };
    loadUser();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/login`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      }
    );
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Identifiants invalides");
      }
      let errMsg = "Erreur de connexion";
      try {
        const errData = await response.json();
        errMsg = errData.message || errMsg;
      } catch {}
      throw new Error(errMsg);
    }

    const data = await response.json();
    localStorage.setItem("auth_token", data.token);
    setToken(data.token);

    // fetch user info
    const userRes = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/me`,
      {
        headers: {
          Authorization: `Bearer ${data.token}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
      }
    );
    if (userRes.ok) {
      const userData = await userRes.json();
      setUser(userData);
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/logout`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            credentials: "include",
          }
        );
      }
    } catch (e) {
      console.error("Logout error", e);
    }
    localStorage.removeItem("auth_token");
    setToken(null);
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    token,
    loading,
    login,
    logout,
    isAuthenticated: !!token,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
};
