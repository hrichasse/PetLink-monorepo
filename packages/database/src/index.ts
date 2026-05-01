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
  try {
    const url = new URL(raw);
    if (!url.searchParams.has("connection_limit")) {
      url.searchParams.set("connection_limit", "1");
    }
    return url.toString();
  } catch {
    return raw;
  }
}

const prismaClientSingleton = () =>
  new PrismaClient({
    log: ["error"],
    datasources: { db: { url: buildDatasourceUrl() } },
  });

// Always cache on globalThis so serverless warm containers (Vercel)
// reuse the same connection pool instead of opening new connections
// per module re-evaluation.
export const prisma = globalThis.prisma ?? prismaClientSingleton();

globalThis.prisma = prisma;

export { PrismaClient } from "@prisma/client";
