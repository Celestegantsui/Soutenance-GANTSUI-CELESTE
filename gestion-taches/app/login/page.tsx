"use client";

// Cette page permet à l'utilisateur de se connecter avec email et mot de passe.
// Elle redirige vers le dashboard après connexion réussie.

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login, isAuthenticated } = useAuth();

  // Rediriger automatiquement vers dashboard si déjà connecté
  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, router]);

  // Gérer la soumission du formulaire de connexion
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (err: any) {
      if (err.name === "TypeError") {
        setError(
          "Impossible de contacter le serveur. Vérifiez que le backend tourne et que CORS est configuré."
        );
      } else {
        setError(err.message || "Erreur de connexion");
      }
      console.error("Erreur:", err);
    } finally {
      setLoading(false);
    }
  };

  // Interface : formulaire centré avec champs email, mot de passe, bouton et message d'erreur
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <form
        onSubmit={handleLogin}
        className="bg-white p-8 rounded-xl shadow-md w-full max-w-md space-y-4"
      >
        <h1 className="text-2xl font-bold text-center">Connexion</h1>

        <input
          type="email"
          placeholder="Email"
          className="w-full p-3 border rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
        />

        <input
          type="password"
          placeholder="Mot de passe"
          className="w-full p-3 border rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white p-3 rounded hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? "⏳ Connexion..." : "Se connecter"}
        </button>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}
      </form>
    </div>
  );
}
