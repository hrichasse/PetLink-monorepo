import type { Service } from "@prisma/client";

export type ServiceProviderSummary = { fullName: string; city: string | null };

export type ServiceModel = Service & { provider?: ServiceProviderSummary | null };