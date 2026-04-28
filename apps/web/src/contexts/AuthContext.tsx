import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { ApiError, clearAccessToken, getAccessToken } from "@/lib/api";
import { authApi } from "@/lib/petlink-api";
import type { Profile, Role } from "@/lib/petlink-data";
import { toast } from "sonner";

type PetLinkUser = { id: string; email?: string; user_metadata?: Record<string, unknown> };
type PetLinkSession = { access_token: string; refresh_token: string; user: PetLinkUser };

type AuthContextValue = {
  user: PetLinkUser | null;
  session: PetLinkSession | null;
  profile: Profile | null;
  role: Role;
  loading: boolean;
  refreshProfile: () => Promise<Profile | null>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string, role: Role) => Promise<void>;
  sendMagicLink: (email: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function isRole(value: unknown): value is Role {
  return value === "OWNER" || value === "PROVIDER";
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<PetLinkSession | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRoleState] = useState<Role>("OWNER");
  const [loading, setLoading] = useState(true);

  async function signOutSilently() {
    clearAccessToken();
    setSession(null);
    setProfile(null);
    setRoleState("OWNER");
  }

  async function refreshProfile(options?: { silentUnauthorized?: boolean }) {
    try {
      const me = await authApi.getMe();
      if (!isRole(me.role)) throw new Error("Tu cuenta no tiene un rol válido");
      setProfile(me);
      setRoleState(me.role);
      return me;
    } catch (error) {
      if (options?.silentUnauthorized && error instanceof ApiError && error.status === 401) {
        return null;
      }
      toast.error(error instanceof Error ? error.message : "No se pudo cargar tu perfil");
      return null;
    }
  }

  async function provisionAndLoad(currentSession: PetLinkSession) {
    const fullName = String(currentSession.user.user_metadata?.full_name ?? currentSession.user.email?.split("@")[0] ?? "Usuario PetLink");
    await authApi.provisionUser({ fullName, phone: null, city: null });
    const me = await refreshProfile();
    if (!me) {
      clearAccessToken();
      setSession(null);
      setProfile(null);
      throw new Error("No se pudo validar tu perfil");
    }
  }

  useEffect(() => {
    void (async () => {
      const token = await getAccessToken();
      if (!token) {
        setLoading(false);
        return;
      }

      const me = await refreshProfile({ silentUnauthorized: true });
      if (me) setSession({ access_token: token, refresh_token: "", user: { id: me.userId } });
      setLoading(false);
    })();
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user: session?.user ?? null,
    session,
    profile,
    role,
    loading,
    refreshProfile,
    signIn: async (email, password) => {
      const nextSession = await authApi.login({ email, password });
      setSession(nextSession);
      await provisionAndLoad(nextSession);
      toast.success("Bienvenido de vuelta a PetLink");
    },
    signUp: async (email, password, fullName, selectedRole) => {
      const nextSession = await authApi.signup({ email, password, fullName, role: selectedRole });
      setRoleState(selectedRole);
      setSession(nextSession);
      await provisionAndLoad(nextSession);
      toast.success("Cuenta creada. Revisa tu correo si se requiere confirmación.");
    },
    sendMagicLink: async (email) => {
      if (!email) throw new Error("Ingresa tu correo");
      toast.error("Magic link no está conectado en el auth real de PetLink");
    },
    signInWithGoogle: async () => {
      toast.error("Google no está conectado en el auth real de PetLink");
    },
    signOut: async () => {
      clearAccessToken();
      setSession(null);
      setProfile(null);
      toast.success("Sesión cerrada");
    },
  }), [loading, profile, role, session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
