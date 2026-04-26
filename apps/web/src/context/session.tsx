"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase";

type SessionContextValue = {
  session: Session | null;
  isLoading: boolean;
  /** Raw JWT access token, or null if not authenticated. */
  token: string | null;
};

const SessionContext = createContext<SessionContextValue>({
  session: null,
  isLoading: true,
  token: null
});

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initial session fetch
    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setIsLoading(false);
    });

    // Keep session in sync across tabs and token refresh events
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <SessionContext.Provider
      value={{ session, isLoading, token: session?.access_token ?? null }}
    >
      {children}
    </SessionContext.Provider>
  );
}

/** Returns the current session context. Use inside any Client Component. */
export const useSession = () => useContext(SessionContext);
