import type { NextRequest } from "next/server";

import { supabaseAdminClient } from "../lib/supabase";
import { UnauthorizedError } from "../errors/unauthorized-error";
import type { AuthUser } from "../types/auth-user";
import { getAuthToken } from "../utils/get-auth-token";

export type AuthContext = AuthUser;

export const getAuthContext = async (request: NextRequest): Promise<AuthContext> => {
  const token = getAuthToken(request.headers.get("authorization"));

  const {
    data: { user },
    error
  } = await supabaseAdminClient.auth.getUser(token);

  if (error || !user) {
    throw new UnauthorizedError("Invalid or expired authentication token.", error?.message);
  }

  return {
    userId: user.id,
    email: user.email,
    role: user.user_metadata.role as string | undefined
  };
};

export const requireAuth = getAuthContext;
