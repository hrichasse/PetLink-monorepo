import type { ErrorCode } from "../errors/error-codes";
import type { PaginationMeta } from "../utils/pagination";

export type ApiSuccess<TData> = {
  success: true;
  message: string;
  data: TData;
};

export type ApiPaginatedSuccess<TItem> = ApiSuccess<TItem[]> & {
  meta: PaginationMeta;
};

export type ApiError = {
  success: false;
  message: string;
  errorCode: ErrorCode;
  details?: unknown;
};

export type ApiResponse<TData> = ApiSuccess<TData> | ApiError;
