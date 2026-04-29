import type { UserRole } from "@prisma/client";

export type CreateUserProfileDto = {
  fullName: string;
  phone?: string | null;
  city?: string | null;
  location?: string | null;
  role?: UserRole;
};
