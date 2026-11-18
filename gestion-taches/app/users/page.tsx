"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import axios from "@/lib/axiosConfig";
import { useAuth } from "@/lib/AuthContext";
import { useThemeColors } from "@/lib/useThemeColors";

type Role = "admin" | "technician";
type Status = "active" | "inactive";

interface Account {
  id: number;
  name: string;
  email: string;
  role: string;
  gender?: "female" | "male" | null;
  status?: string;
}

interface FormState {
  name: string;
  email: string;
  password: string;
  role: Role;
  gender: "female" | "male" | "";
  status: Status;
}

const initialForm: FormState = {
  name: "",
  email: "",
  password: "",
  role: "technician",
  gender: "",
  status: "active",
};

function apiError(error: unknown, fallback: string) {
  if (!error || typeof error !== "object") return fallback;
  const response = (error as { response?: { data?: { message?: string; error?: string } } }).response;
  return response?.data?.message || response?.data?.error || fallback;
}

function roleLabel(role: string, gender?: string | null) {
  if (role.toLowerCase() === "admin") return "Admin";
  return gender === "female" ? "Technicienne" : "Technicien";
}

export default function UsersPage() {
  const { user, loading: authLoading } = useAuth();
  const { colors } = useThemeColors();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [form, setForm] = useState<FormState>(initialForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const isAdmin = user?.role?.toLowerCase() === "admin";
  const totalAccounts = accounts.length;
  const activeAccounts = accounts.filter((account) =>
    ["active", "actif"].includes(account.status?.toLowerCase() ?? ""),
  ).length;
  const inactiveAccounts = accounts.filter((account) =>
    ["inactive", "inactif"].includes(account.status?.toLowerCase() ?? ""),
  ).length;

  const loadAccounts = async () => {
    setLoading(true);
    try {
      const response = await axios.get("/api/users");
      const data = response.data?.data ?? response.data;
      setAccounts(Array.isArray(data) ? data : []);
    } catch (error) {
      setMessage({ type: "error", text: apiError(error, "Impossible de charger les comptes.") });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) loadAccounts();
  }, [isAdmin]);

  const updateForm = (field: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const editAccount = (account: Account) => {
    setEditingId(account.id);
    setForm({
      name: account.name,
      email: account.email,
      password: "",
      role: account.role.toLowerCase() === "admin" ? "admin" : "technician",
      gender: account.gender ?? "",
      status: account.status?.toLowerCase() === "inactive" ? "inactive" : "active",
    });
    setMessage(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(initialForm);
  };

  const saveAccount = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const payload = {
        name: form.name,
        email: form.email,
        role: editingId === null ? "technician" : form.role,
        gender: form.gender,
        status: form.status,
        ...(form.password ? { password: form.password } : {}),
      };
      if (editingId === null) {
        await axios.post("/api/users", payload);
        setMessage({ type: "success", text: "Compte enregistré avec succès." });
      } else {
        await axios.put(`/api/users/${editingId}`, payload);
        setMessage({ type: "success", text: "Compte modifié avec succès." });
      }
      resetForm();
      await loadAccounts();
    } catch (error) {
      setMessage({ type: "error", text: apiError(error, "Impossible d'enregistrer le compte.") });
    } finally {
      setSaving(false);
    }
  };

  const deleteAccount = async (account: Account) => {
    if (String(account.id) === String(user?.id)) {
      setMessage({ type: "error", text: "Vous ne pouvez pas supprimer votre propre compte." });
      return;
    }
    if (!window.confirm(`Supprimer le compte de ${account.name} ?`)) return;
    try {
      await axios.delete(`/api/users/${account.id}`);
      setAccounts((current) => current.filter((item) => item.id !== account.id));
      setMessage({ type: "success", text: "Compte supprimé avec succès." });
    } catch (error) {
      setMessage({ type: "error", text: apiError(error, "Impossible de supprimer le compte.") });
    }
  };

  if (authLoading) return <div className="p-6 text-center text-gray-600">Chargement...</div>;

  if (!isAdmin) {
    return <div className="p-6 text-center"><h1 className="text-2xl font-bold text-red-600 mb-3">Accès refusé</h1><p className="text-gray-600 mb-5">Seuls les administrateurs peuvent enregistrer des comptes.</p><Link href="/dashboard" className="text-blue-600 hover:underline">Retour au tableau de bord</Link></div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion des comptes</h1>
          <p className="mt-1 text-gray-500">Enregistrer et gérer les comptes WEEK SUPPORT</p>
        </div>
        <div className="lg:text-right">
          <h2 className="mb-2 text-sm font-semibold text-gray-700">Comptes</h2>
          <div className="grid grid-cols-3 gap-2">
            <div className="min-w-24 rounded-lg border border-gray-200 bg-white px-3 py-2">
              <p className="whitespace-nowrap text-xs text-gray-500">👥 Total</p>
              <p className="text-xl font-bold text-gray-900">{loading ? "-" : totalAccounts}</p>
            </div>
            <div className="min-w-24 rounded-lg border border-green-200 bg-green-50 px-3 py-2">
              <p className="whitespace-nowrap text-xs text-green-700">🟢 Actifs</p>
              <p className="text-xl font-bold text-green-800">{loading ? "-" : activeAccounts}</p>
            </div>
            <div className="min-w-24 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
              <p className="whitespace-nowrap text-xs text-red-700">🔴 Inactifs</p>
              <p className="text-xl font-bold text-red-800">{loading ? "-" : inactiveAccounts}</p>
            </div>
          </div>
        </div>
      </header>
      {message && <div className={`rounded-xl border px-4 py-3 ${message.type === "success" ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"}`}>{message.text}</div>}

      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-5">{editingId === null ? "Créer un compte" : "Modifier un compte"}</h2>
        <form onSubmit={saveAccount} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="text-sm font-medium text-gray-700">Nom<input required value={form.name} onChange={(event) => updateForm("name", event.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 p-2.5" /></label>
          <label className="text-sm font-medium text-gray-700">Adresse e-mail<input required type="email" value={form.email} onChange={(event) => updateForm("email", event.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 p-2.5" /></label>
          <label className="text-sm font-medium text-gray-700">Mot de passe{editingId !== null && <span className="font-normal text-gray-500"> (laisser vide pour conserver)</span>}<input required={editingId === null} minLength={8} type="password" value={form.password} onChange={(event) => updateForm("password", event.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 p-2.5" /></label>
          <label className="text-sm font-medium text-gray-700">Sexe<select required value={form.gender} onChange={(event) => updateForm("gender", event.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 p-2.5"><option value="">Sélectionner</option><option value="female">Féminin</option><option value="male">Masculin</option></select></label>
          <label className="text-sm font-medium text-gray-700">Rôle<div className="mt-1 rounded-lg border border-gray-300 bg-gray-50 p-2.5">{editingId === null ? (form.gender === "female" ? "Technicienne" : "Technicien") : roleLabel(form.role, form.gender)}</div></label>
          <label className="text-sm font-medium text-gray-700">État du compte<select value={form.status} onChange={(event) => updateForm("status", event.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 p-2.5"><option value="active">Actif</option><option value="inactive">Inactif</option></select></label>
          <div className="flex items-end gap-3"><button type="submit" disabled={saving} className="rounded-lg px-5 py-2.5 font-medium text-white disabled:opacity-60" style={{ backgroundColor: colors.bg }}>{saving ? "Enregistrement..." : editingId === null ? "Créer le compte" : "Enregistrer les modifications"}</button>{editingId !== null && <button type="button" onClick={resetForm} className="rounded-lg border border-gray-300 px-5 py-2.5 text-gray-700">Annuler</button>}</div>
        </form>
      </section>

      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"><div className="p-6 pb-4"><h2 className="text-xl font-bold text-gray-900">Liste des comptes existants</h2></div>{loading ? <div className="p-8 text-center text-gray-500">Chargement des comptes...</div> : accounts.length === 0 ? <div className="p-8 text-center text-gray-500">Aucun compte enregistré.</div> : <div className="overflow-x-auto"><table className="w-full text-left"><thead className="bg-gray-50 border-y border-gray-100"><tr><th className="px-5 py-3 text-sm text-gray-600">Nom</th><th className="px-5 py-3 text-sm text-gray-600">E-mail</th><th className="px-5 py-3 text-sm text-gray-600">Rôle</th><th className="px-5 py-3 text-sm text-gray-600">État</th><th className="px-5 py-3 text-sm text-gray-600">Actions</th></tr></thead><tbody>{accounts.map((account) => <tr key={account.id} className="border-b last:border-0 hover:bg-gray-50"><td className="px-5 py-4 font-medium">{account.name}</td><td className="px-5 py-4 text-gray-600">{account.email}</td><td className="px-5 py-4"><span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">{roleLabel(account.role, account.gender)}</span></td><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${account.status?.toLowerCase() === "inactive" ? "bg-gray-100 text-gray-600" : "bg-green-50 text-green-700"}`}>{account.status?.toLowerCase() === "inactive" ? "Inactif" : "Actif"}</span></td><td className="px-5 py-4"><div className="flex gap-3"><button onClick={() => editAccount(account)} className="text-sm text-blue-600 hover:underline">Modifier</button><button onClick={() => deleteAccount(account)} disabled={String(account.id) === String(user?.id)} className="text-sm text-red-600 hover:underline disabled:text-gray-400 disabled:no-underline">Supprimer</button></div></td></tr>)}</tbody></table></div>}</section>
    </div>
  );
}