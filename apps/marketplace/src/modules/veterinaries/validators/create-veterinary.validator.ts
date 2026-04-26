import { VeterinarySpecialty } from "@prisma/client";
import { z } from "zod";

export const createVeterinarySchema = z
  .object({
    name: z.string().trim().min(2).max(200),
    description: z.union([z.string().trim().max(2000), z.null()]).optional(),
    phone: z.union([z.string().trim().max(30), z.null()]).optional(),
    email: z.union([z.string().email().max(160), z.null()]).optional(),
    website: z.union([z.string().url().max(300), z.null()]).optional(),
    address: z.string().trim().min(3).max(300),
    city: z.string().trim().min(2).max(100),
    lat: z.union([z.number().min(-90).max(90), z.null()]).optional(),
    lng: z.union([z.number().min(-180).max(180), z.null()]).optional(),
    specialties: z.array(z.nativeEnum(VeterinarySpecialty)).min(1).optional(),
    imageUrl: z.union([z.string().url().max(500), z.null()]).optional(),
    isPartner: z.boolean().optional(),
    isActive: z.boolean().optional(),
    operatingHours: z.union([z.record(z.unknown()), z.null()]).optional()
  })
  .strict();
