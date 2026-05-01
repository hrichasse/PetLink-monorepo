import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

const prismaClientSingleton = () =>
  new PrismaClient({
    log: ["error"]
  });

// Always cache on globalThis so serverless warm containers (Vercel)
// reuse the same connection pool instead of opening new connections
// per module re-evaluation.
export const prisma = globalThis.prisma ?? prismaClientSingleton();

globalThis.prisma = prisma;

export { PrismaClient } from "@prisma/client";
