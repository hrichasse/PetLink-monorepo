import { prisma } from "@petlink/database";

export const assistantUsageRepository = {
  getCountForDay: async (userId: string, day: string): Promise<number> => {
    const row = await prisma.assistantUsage.findUnique({
      where: { userId_day: { userId, day } },
      select: { count: true }
    });
    return row?.count ?? 0;
  },

  /** Atomically increments (and creates on first use) the daily counter. */
  incrementForDay: async (userId: string, day: string): Promise<number> => {
    const row = await prisma.assistantUsage.upsert({
      where: { userId_day: { userId, day } },
      create: { userId, day, count: 1 },
      update: { count: { increment: 1 } },
      select: { count: true }
    });
    return row.count;
  }
};
