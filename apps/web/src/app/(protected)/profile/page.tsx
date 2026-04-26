"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";

import { useSession } from "@/context/session";
import { supabase } from "@/lib/supabase";
import { authApi, ApiClientError } from "@/lib/api";
import type { UserProfileDto } from "@/lib/api";

export default function ProfilePage() {
  const { token, isLoading: sessionLoading } = useSession();
  const router = useRouter();

  const [profile, setProfile] = useState<UserProfileDto | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [city, setCity] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (sessionLoading || token === null) return;

    setIsLoading(true);
    setLoadError(null);

    authApi
      .getMe(token)
      .then((data) => {
        setProfile(data);
        setFullName(data.fullName);
        setCity(data.city ?? "");
      })
      .catch((err: unknown) => {
        setLoadError(err instanceof ApiClientError ? err.message : "Error al cargar el perfil.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [token, sessionLoading]);

  const handleLogout = async (): Promise<void> => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleSave = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (token === null) return;

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      // Build payload without undefined values (exactOptionalPropertyTypes)
      const updates: { fullName?: string; city?: string } = {};
      if (fullName.trim().length > 0) updates.fullName = fullName.trim();
      if (city.trim().length > 0) updates.city = city.trim();

      const updated = await authApi.updateMe(token, updates);
      setProfile(updated);
      setSaveSuccess(true);
    } catch (err: unknown) {
      setSaveError(err instanceof ApiClientError ? err.message : "Error al actualizar el perfil.");
    } finally {
      setIsSaving(false);
    }
  };

  if (sessionLoading || isLoading) return <p>Cargando perfil...</p>;
  if (loadError !== null) return <p role="alert">Error: {loadError}</p>;
  if (profile === null) return null;

  return (
    <main style={{ padding: "24px" }}>
      <h1>Mi Perfil</h1>
      <p>
        <strong>Rol:</strong> {profile.role}
      </p>

      <form onSubmit={(e) => { void handleSave(e); }} style={{ maxWidth: "400px" }}>
        <div>
          <label htmlFor="fullName">Nombre completo</label>
          <br />
          <input
            id="fullName"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            style={{ width: "100%" }}
          />
        </div>
        <div style={{ marginTop: "12px" }}>
          <label htmlFor="city">Ciudad</label>
          <br />
          <input
            id="city"
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            style={{ width: "100%" }}
          />
        </div>
        {saveError !== null && (
          <p role="alert" style={{ color: "red" }}>
            {saveError}
          </p>
        )}
        {saveSuccess && <p style={{ color: "green" }}>Perfil actualizado correctamente.</p>}
        <div style={{ marginTop: "16px", display: "flex", gap: "12px" }}>
          <button type="submit" disabled={isSaving}>
            {isSaving ? "Guardando..." : "Guardar cambios"}
          </button>
          <button
            type="button"
            onClick={() => { void handleLogout(); }}
          >
            Cerrar sesión
          </button>
        </div>
      </form>
    </main>
  );
}
