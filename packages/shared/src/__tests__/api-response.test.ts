import { ok, created, fail } from "../responses/api-response";
import { HTTP_STATUS } from "../constants/http-status";
import { ERROR_CODES } from "../errors/error-codes";

// NextResponse.json() uses the Web Response API, available in Node >= 18.
async function toJson(response: Response): Promise<unknown> {
  return response.json() as Promise<unknown>;
}

describe("api-response helpers", () => {
  describe("ok()", () => {
    it("returns 200 with success envelope", async () => {
      const res = ok("Operación exitosa.", { id: "abc" });

      expect(res.status).toBe(HTTP_STATUS.OK);
      const body = await toJson(res);
      expect(body).toEqual({
        success: true,
        message: "Operación exitosa.",
        data: { id: "abc" },
      });
    });

    it("accepts a custom status code", async () => {
      // NextResponse.json() does not support body-less status codes (e.g. 204).
      // We test with 201 to verify the status override path.
      const res = ok("Custom status.", null, HTTP_STATUS.CREATED);
      expect(res.status).toBe(HTTP_STATUS.CREATED);
    });
  });

  describe("created()", () => {
    it("returns 201 with success envelope", async () => {
      const res = created("Recurso creado.", { name: "Fluffy" });

      expect(res.status).toBe(HTTP_STATUS.CREATED);
      const body = await toJson(res);
      expect(body).toEqual({
        success: true,
        message: "Recurso creado.",
        data: { name: "Fluffy" },
      });
    });
  });

  describe("fail()", () => {
    it("returns 400 with error envelope by default", async () => {
      const res = fail("Datos inválidos.", ERROR_CODES.VALIDATION_ERROR);

      expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST);
      const body = await toJson(res);
      expect(body).toEqual({
        success: false,
        message: "Datos inválidos.",
        errorCode: "VALIDATION_ERROR",
        details: undefined,
      });
    });

    it("returns the specified HTTP status", async () => {
      const res = fail("No autorizado.", ERROR_CODES.UNAUTHORIZED, undefined, HTTP_STATUS.UNAUTHORIZED);
      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED);
    });

    it("includes details when provided", async () => {
      const details = { field: "email" };
      const res = fail("Conflicto.", ERROR_CODES.CONFLICT, details, HTTP_STATUS.CONFLICT);
      const body = (await toJson(res)) as { details: unknown };
      expect(body.details).toEqual(details);
    });
  });
});
