"use client";

import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";

import { supabase } from "@/lib/supabase";
import { useSession } from "@/context/session";
import { authApi } from "@/lib/api";

export default function LoginPage() {
  const { session, isLoading: sessionLoading } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Redirect already-authenticated users
  useEffect(() => {
    if (!sessionLoading && session !== null) {
      router.push("/profile");
    }
  }, [session, sessionLoading, router]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    const { data: signInData, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setErrorMessage(error.message);
      setIsLoading(false);
      return;
    }

    // Auto-provisioning: ensure UserProfile exists for this Supabase user.
    // This is idempotent — safe to call on every login (returns 200 if already exists).
    // A failure here is not a blocker: the user can still use the app, and the profile
    // page will show a clear error if /users/me returns 404.
    const accessToken = signInData.session?.access_token;
    if (accessToken !== undefined) {
      const defaultFullName = email.split("@")[0] ?? email;
      try {
        await authApi.createProfile(accessToken, { fullName: defaultFullName });
      } catch {
        // Non-blocking: profile creation failed (network issue, server down, etc.)
        // The user is still authenticated; they can retry via the profile page.
      }
    }

    router.push("/profile");
  };

  if (sessionLoading) {
    return <p>Cargando...</p>;
  }

  return (
    <main>
      <h1>Iniciar sesión — PetLink</h1>
      <form onSubmit={(e) => { void handleSubmit(e); }}>
        <div>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>
        <div>
          <label htmlFor="password">Contraseña</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </div>
        {errorMessage !== null && (
          <p role="alert" style={{ color: "red" }}>
            {errorMessage}
          </p>
        )}
        <button type="submit" disabled={isLoading}>
          {isLoading ? "Cargando..." : "Entrar"}
        </button>
      </form>
    </main>
  );
}
