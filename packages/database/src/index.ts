import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

/**
 * Builds the DATABASE_URL ensuring `connection_limit=1` is present.
 *
 * Prisma + PgBouncer (Supabase pooler) in serverless environments REQUIRES
 * connection_limit=1. Without it, Prisma tries to open multiple connections
 * simultaneously, PgBouncer rejects them in transaction mode, and routes
 * return 500 on cold start. This fix is applied in code so no env-var
 * changes are needed in Vercel or locally.
 */
function buildDatasourceUrl(): string | undefined {
  const raw = process.env.DATABASE_URL;
  if (!raw) return undefined;
  // Use plain string concatenation — never parse through `new URL()`.
  // Parsing and re-serialising a postgresql:// URL can corrupt
  // percent-encoded characters in the password (e.g. £ → %C2%A3 may be
  // double-encoded or decoded differently on Node 18/20).
  if (raw.includes("connection_limit=")) return raw;
  const separator = raw.includes("?") ? "&" : "?";
  return `${raw}${separator}connection_limit=1`;
}

const prismaClientSingleton = () => {
  const url = buildDatasourceUrl();
  return new PrismaClient({
    log: ["error"],
    ...(url ? { datasources: { db: { url } } } : {}),
  });
};

// Always cache on globalThis so serverless warm containers (Vercel)
// reuse the same connection pool instead of opening new connections
// per module re-evaluation.
export const prisma = globalThis.prisma ?? prismaClientSingleton();

globalThis.prisma = prisma;

export { PrismaClient } from "@prisma/client";
