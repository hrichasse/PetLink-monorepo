"use client";

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getWebSupabaseClient } from "@/lib/supabase-browser";
import { authApi } from "@/lib/petlink-api";
import { setAccessToken, setRefreshToken } from "@/lib/api";
import { toast } from "sonner";

export function AuthCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    void (async () => {
      try {
        // Supabase OAuth already established the session internally
        // Just need to check if session exists and provision if needed
        const client = getWebSupabaseClient();
        const { data, error } = await client.auth.getSession();

        if (error || !data.session) {
          console.error("No session found after OAuth callback:", error);
          toast.error("No se pudo completar la autenticación con Google");
          navigate("/login", { replace: true });
          return;
        }

        // Session established - store tokens
        setAccessToken(data.session.access_token);
        if (data.session.refresh_token) {
          setRefreshToken(data.session.refresh_token);
        }

        toast.success("Completando autenticación...");
        
        // Reload to /dashboard so ProtectedRoutes can handle smart redirect
        // (will go to onboarding if profile incomplete, or dashboard if complete)
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 500);
      } catch (err) {
        console.error("Unexpected error in auth callback:", err);
        toast.error("Error inesperado durante la autenticación");
        navigate("/login", { replace: true });
      }
    })();
  }, [navigate]);

  // Show loading state while processing
  return (
    <div className="grid min-h-screen place-items-center bg-background p-4">
      <div className="text-center">
        <h1 className="text-2xl font-black">Completando autenticación...</h1>
        <p className="mt-2 text-muted-foreground">Por favor espera mientras validamos tu cuenta con Google.</p>
      </div>
    </div>
  );
}
