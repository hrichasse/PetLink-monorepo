import type { Prisma } from "@prisma/client";

export type BookingModel = Prisma.BookingGetPayload<{
	include: {
		service: true;
		pet: true;
	};
}>;