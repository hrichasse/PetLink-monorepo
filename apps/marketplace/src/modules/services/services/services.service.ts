import type { CreateServiceDto, ListServicesQueryDto, UpdateServiceDto } from "@/modules/services/dtos";
import { servicesRepository } from "@/modules/services/repositories";
import type { ServiceModel } from "@/modules/services/types";
import { HTTP_STATUS } from "@petlink/shared";
import { AppError } from "@petlink/shared";
import { ERROR_CODES } from "@petlink/shared";
import { NotFoundError } from "@petlink/shared";

const SERVICE_NOT_FOUND_MESSAGE = "Service not found.";
const SERVICE_FORBIDDEN_MESSAGE = "You do not have access to this service.";

const ensureProviderAccess = (service: ServiceModel, authUserId: string): void => {
  if (service.providerId !== authUserId) {
    throw new AppError(SERVICE_FORBIDDEN_MESSAGE, {
      statusCode: HTTP_STATUS.FORBIDDEN,
      code: ERROR_CODES.FORBIDDEN
    });
  }
};

export const servicesService = {
  createService: (authUserId: string, payload: CreateServiceDto): Promise<ServiceModel> => {
    return servicesRepository.create(authUserId, payload);
  },

  listServices: (query: ListServicesQueryDto): Promise<ServiceModel[]> => {
    return servicesRepository.findMany({
      ...query,
      // Public marketplace should default to active listings only.
      isActive: query.isActive ?? true
    });
  },

  getServiceById: async (id: string): Promise<ServiceModel> => {
    const service = await servicesRepository.findById(id);

    if (!service) {
      throw new NotFoundError(SERVICE_NOT_FOUND_MESSAGE);
    }

    return service;
  },

  updateServiceForProvider: async (authUserId: string, serviceId: string, payload: UpdateServiceDto): Promise<ServiceModel> => {
    const service = await servicesService.getServiceById(serviceId);
    ensureProviderAccess(service, authUserId);

    return servicesRepository.updateById(serviceId, payload);
  },

  deleteServiceForProvider: async (authUserId: string, serviceId: string): Promise<void> => {
    const service = await servicesService.getServiceById(serviceId);
    ensureProviderAccess(service, authUserId);

    await servicesRepository.deleteById(serviceId);
  }
};