import { withErrorHandler } from "../middleware/error-handler";
import { AppError } from "../errors/app-error";
import { HTTP_STATUS } from "../constants/http-status";
import { ERROR_CODES } from "../errors/error-codes";
import { ok } from "../responses/api-response";

async function toJson(response: Response): Promise<unknown> {
  return response.json() as Promise<unknown>;
}

describe("withErrorHandler()", () => {
  it("returns the handler result when no error is thrown", async () => {
    const response = await withErrorHandler(() => Promise.resolve(ok("OK", { result: true })));

    expect(response.status).toBe(HTTP_STATUS.OK);
    const body = await toJson(response);
    expect(body).toMatchObject({ success: true, data: { result: true } });
  });

  it("maps AppError to the correct status and errorCode", async () => {
    const response = await withErrorHandler(() => {
      throw new AppError("No encontrado.", {
        statusCode: HTTP_STATUS.NOT_FOUND,
        code: ERROR_CODES.RESOURCE_NOT_FOUND,
      });
    });

    expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
    const body = (await toJson(response)) as { success: boolean; errorCode: string };
    expect(body.success).toBe(false);
    expect(body.errorCode).toBe("RESOURCE_NOT_FOUND");
  });

  it("maps unauthorized AppError to 401", async () => {
    const response = await withErrorHandler(() => {
      throw new AppError("No autorizado.", {
        statusCode: HTTP_STATUS.UNAUTHORIZED,
        code: ERROR_CODES.UNAUTHORIZED,
      });
    });

    expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
  });

  it("maps conflict AppError to 409", async () => {
    const response = await withErrorHandler(() => {
      throw new AppError("Ya existe.", {
        statusCode: HTTP_STATUS.CONFLICT,
        code: ERROR_CODES.CONFLICT,
      });
    });

    expect(response.status).toBe(HTTP_STATUS.CONFLICT);
  });

  it("returns 500 for unknown errors", async () => {
    const response = await withErrorHandler(() => {
      throw new Error("Unexpected crash.");
    });

    expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    const body = (await toJson(response)) as { errorCode: string };
    expect(body.errorCode).toBe("INTERNAL_ERROR");
  });

  it("handles rejected promises", async () => {
    const response = await withErrorHandler(() => Promise.reject(new Error("Promise rejected.")));

    expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
  });
});
