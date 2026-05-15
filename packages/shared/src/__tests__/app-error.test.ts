import { AppError } from "../errors/app-error";
import { HTTP_STATUS } from "../constants/http-status";
import { ERROR_CODES } from "../errors/error-codes";

describe("AppError", () => {
  it("creates an error with default values", () => {
    const error = new AppError("Something went wrong.");

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(AppError);
    expect(error.message).toBe("Something went wrong.");
    expect(error.name).toBe("AppError");
    expect(error.statusCode).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    expect(error.code).toBe("INTERNAL_ERROR");
    expect(error.details).toBeUndefined();
  });

  it("creates an error with custom statusCode and code", () => {
    const error = new AppError("Not found.", {
      statusCode: HTTP_STATUS.NOT_FOUND,
      code: ERROR_CODES.RESOURCE_NOT_FOUND,
    });

    expect(error.statusCode).toBe(404);
    expect(error.code).toBe("RESOURCE_NOT_FOUND");
  });

  it("stores details when provided", () => {
    const details = { field: "email", issue: "already exists" };
    const error = new AppError("Conflict.", {
      statusCode: HTTP_STATUS.CONFLICT,
      code: ERROR_CODES.CONFLICT,
      details,
    });

    expect(error.details).toEqual(details);
  });

  it("is catchable as a base Error", () => {
    expect(() => {
      throw new AppError("Thrown error.", { code: ERROR_CODES.VALIDATION_ERROR });
    }).toThrow("Thrown error.");
  });
});
