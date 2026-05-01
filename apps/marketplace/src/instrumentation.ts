/**
 * Next.js instrumentation hook — runs once when the server process starts.
 * Pre-warms the Prisma connection pool so the first request doesn't pay
 * the cold-start latency of establishing a DB connection.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { prisma } = await import("@petlink/database");
    try {
      await prisma.$connect();
      console.log("[marketplace] ✓ Database connection ready");
    } catch (error) {
      console.error("[marketplace] Database warm-up failed:", error);
    }
  }
}
