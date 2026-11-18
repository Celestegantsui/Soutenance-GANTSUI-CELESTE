"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";

interface UseFetchResult<T> {
  data: T | null;
  error: any;
  loading: boolean;
}

export function useFetch<T = any>(
  endpoint: string,
  options: RequestInit = {}
): UseFetchResult<T> {
  const { token } = useAuth();
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const headers: any = options.headers || {};
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }
        const res = await fetch(endpoint, {
          ...options,
          headers,
          credentials: "include",
        });
        if (!res.ok) throw new Error("Network response was not ok");
        const json = await res.json();
        setData(json);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [endpoint, token]);

  return { data, error, loading };
}
