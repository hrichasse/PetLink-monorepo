import type { CreateVeterinaryDto, ListVeterinariesQueryDto, UpdateVeterinaryDto } from "@/modules/veterinaries/dtos";
import { veterinariesRepository } from "@/modules/veterinaries/repositories";
import type { VeterinaryModel } from "@/modules/veterinaries/types";
import { NotFoundError } from "@petlink/shared";

const VETERINARY_NOT_FOUND_MESSAGE = "Veterinary not found.";

export const veterinariesService = {
  createVeterinary: (payload: CreateVeterinaryDto): Promise<VeterinaryModel> => {
    return veterinariesRepository.create(payload);
  },

  listVeterinaries: (query: ListVeterinariesQueryDto): Promise<VeterinaryModel[]> => {
    return veterinariesRepository.findMany({
      ...query,
      isActive: query.isActive ?? true
    });
  },

  getVeterinaryById: async (id: string): Promise<VeterinaryModel> => {
    const vet = await veterinariesRepository.findById(id);

    if (!vet) {
      throw new NotFoundError(VETERINARY_NOT_FOUND_MESSAGE);
    }

    return vet;
  },

  updateVeterinary: async (id: string, payload: UpdateVeterinaryDto): Promise<VeterinaryModel> => {
    await veterinariesService.getVeterinaryById(id);
    return veterinariesRepository.updateById(id, payload);
  },

  deleteVeterinary: async (id: string): Promise<void> => {
    await veterinariesService.getVeterinaryById(id);
    await veterinariesRepository.deleteById(id);
  }
};
