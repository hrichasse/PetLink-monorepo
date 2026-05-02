import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { ApiError, clearAuthTokens, getAccessToken, refreshAccessToken } from "@/lib/api";
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

type JwtPayload = { sub?: string; exp?: number; email?: string; user_metadata?: Record<string, unknown> };

function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    return JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"))) as JwtPayload;
  } catch {
    return null;
  }
}

function getUserIdFromJwt(token: string): string | null {
  return decodeJwtPayload(token)?.sub ?? null;
}

function isJwtExpired(token: string): boolean {
  const exp = decodeJwtPayload(token)?.exp;
  if (!exp) return false;
  return Date.now() / 1000 > exp - 30; // 30s de margen
}

const PROFILE_CACHE_KEY = "petlink:profile_v1";
const PROFILE_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos

function getCachedProfile(): Profile | null {
  try {
    const raw = localStorage.getItem(PROFILE_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { profile: Profile; ts: number };
    if (Date.now() - parsed.ts > PROFILE_CACHE_TTL_MS) return null;
    return parsed.profile;
  } catch {
    return null;
  }
}

function setCachedProfile(p: Profile): void {
  try { localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify({ profile: p, ts: Date.now() })); } catch { /* storage full */ }
}

function clearCachedProfile(): void {
  try { localStorage.removeItem(PROFILE_CACHE_KEY); } catch { /* noop */ }
}

function buildSessionFromToken(token: string): PetLinkSession | null {
  const payload = decodeJwtPayload(token);
  if (!payload?.sub) return null;

  return {
    access_token: token,
    refresh_token: "",
    user: {
      id: payload.sub,
      ...(payload.email ? { email: payload.email } : {}),
      ...(payload.user_metadata ? { user_metadata: payload.user_metadata } : {}),
    },
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<PetLinkSession | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRoleState] = useState<Role>("OWNER");
  const [loading, setLoading] = useState(true);

  async function signOutSilently() {
    clearAuthTokens();
    clearCachedProfile();
    setSession(null);
    setProfile(null);
    setRoleState("OWNER");
  }

  async function refreshProfile(options?: { silentUnauthorized?: boolean; silent?: boolean }) {
    try {
      const me = await authApi.getMe();
      if (!isRole(me.role)) throw new Error("Tu cuenta no tiene un rol válido");
      setCachedProfile(me);
      setProfile(me);
      setRoleState(me.role);
      return me;
    } catch (error) {
      if (options?.silentUnauthorized && error instanceof ApiError && error.status === 401) {
        clearCachedProfile();
        return null;
      }
      if (options?.silent) {
        return null;
      }
      toast.error(error instanceof Error ? error.message : "No se pudo cargar tu perfil");
      return null;
    }
  }

  async function provisionAndLoad(currentSession: PetLinkSession, options?: { silent?: boolean }) {
    const fullName = String(currentSession.user.user_metadata?.full_name ?? currentSession.user.email?.split("@")[0] ?? "Usuario PetLink");
    try {
      await authApi.provisionUser({ fullName, phone: null, city: null, location: null });
    } catch (error) {
      if (!options?.silent) throw error;
    }

    const me = await refreshProfile({ silent: options?.silent });
    if (!me) {
      if (options?.silent) return;
      clearAuthTokens();
      setSession(null);
      setProfile(null);
      throw new Error("No se pudo validar tu perfil");
    }
  }

  useEffect(() => {
    void (async () => {
      let token = await getAccessToken();
      if (token && isJwtExpired(token)) {
        token = await refreshAccessToken();
      }

      if (!token) {
        token = await refreshAccessToken();
      }

      if (!token) {
        await signOutSilently();
        setLoading(false);
        return;
      }

      const restoredSession = buildSessionFromToken(token);
      if (!restoredSession) {
        await signOutSilently();
        setLoading(false);
        return;
      }

      setSession(restoredSession);

      const cachedProfile = getCachedProfile();
      if (cachedProfile?.userId === restoredSession.user.id && isRole(cachedProfile.role)) {
        setProfile(cachedProfile);
        setRoleState(cachedProfile.role);
      }

      setLoading(false);

      const me = await refreshProfile({ silentUnauthorized: true, silent: true });
      if (!me) {
        const currentToken = await getAccessToken();
        if (!currentToken) {
          await signOutSilently();
        }
      }
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
      await provisionAndLoad(nextSession, { silent: true });
      toast.success("Bienvenido de vuelta a PetLink");
    },
    signUp: async (email, password, fullName, selectedRole) => {
      const nextSession = await authApi.signup({ email, password, fullName, role: selectedRole });
      setRoleState(selectedRole);
      setSession(nextSession);
      await provisionAndLoad(nextSession, { silent: true });
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
      await signOutSilently();
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
