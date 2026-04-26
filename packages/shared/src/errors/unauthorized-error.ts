import { HTTP_STATUS } from "../constants/http-status";
import { AppError } from "./app-error";
import { ERROR_CODES } from "./error-codes";

export class UnauthorizedError extends AppError {
  public constructor(message = "Unauthorized.", details?: unknown) {
    super(message, {
      statusCode: HTTP_STATUS.UNAUTHORIZED,
      code: ERROR_CODES.UNAUTHORIZED,
      details
    });
  }
}
