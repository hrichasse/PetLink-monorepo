import type { Pet, PetImage } from "@prisma/client";

export type PetModel = Pet & {
	images?: Pick<PetImage, "imageUrl" | "createdAt">[];
};